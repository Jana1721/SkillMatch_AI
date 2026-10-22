import express from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { parseDocument } from '../services/documentParser.js';
import { analyzeResume, ROLE_BENCHMARKS } from '../services/resumeAnalyzer.js';
import { COMPANY_CATALOG, matchJobDescription } from '../services/jobMatcher.js';
import { generateInterviewQuestions, generateDynamicRoadmap } from '../services/interviewGenerator.js';
import { generateResumeImprovements } from '../services/resumeRewriter.js';
import {
  startInterviewSession,
  submitAnswerAndGetNextTurn,
  getQuestionHint,
  skipInterviewQuestion,
  compileFinalInterviewReport,
  saveAndNotifyEvaluation
} from '../services/interactiveInterviewer.js';
import {
  sendVerificationEmail,
  sendInterviewReportEmail,
  sendPasswordResetEmail,
  getUserEmails
} from '../services/emailService.js';
import { authenticateUser, signToken } from '../services/authMiddleware.js';
import { dbRun, dbGet, dbAll, generateCredentialId } from '../db/database.js';

const router = express.Router();

// Memory storage for multer (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const validExtensions = ['.pdf', '.docx', '.txt', '.md'];
    const hasValidExt = validExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));
    if (hasValidExt) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PDF, DOCX, and TXT files are accepted.'));
    }
  }
});

// Apply user authentication context to all API requests
router.use(authenticateUser);

// ============================================================================
// 1. AUTHENTICATION & INDIVIDUAL USER CREDENTIALS
// ============================================================================

// Register new user with personal email and permanent credential ID
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, passwordConfirm, college, degree, targetRole } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email address, and password are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters in length.' });
    }

    if (passwordConfirm && password !== passwordConfirm) {
      return res.status(400).json({ error: 'Password and confirmation do not match.' });
    }

    // Check duplicate personal email
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await dbGet('SELECT id FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this personal email address already exists. Please log in.' });
    }

    // Generate unique permanent Credential ID
    const credentialId = generateCredentialId();
    const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    await dbRun(
      `INSERT INTO users (id, credential_id, name, email, password_hash, college, degree, target_role, email_verified, verification_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        credentialId,
        name.trim(),
        normalizedEmail,
        passwordHash,
        college || 'University',
        degree || 'B.Tech Computer Science',
        targetRole || 'Java Developer',
        0,
        verificationCode
      ]
    );

    const userObj = {
      id: userId,
      credential_id: credentialId,
      credentialId,
      name: name.trim(),
      email: normalizedEmail,
      college: college || 'University',
      degree: degree || 'B.Tech Computer Science',
      targetRole: targetRole || 'Java Developer',
      emailVerified: false
    };

    const token = signToken(userObj);

    // Send verification email to candidate's personal email
    const emailResult = await sendVerificationEmail({
      userId,
      name: name.trim(),
      email: normalizedEmail,
      credentialId,
      token: verificationCode
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully. Verification email sent.',
      user: userObj,
      token,
      emailPreview: emailResult.previewUrl
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

// Login with personal email & password
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await dbGet('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userObj = {
      id: user.id,
      credentialId: user.credential_id,
      name: user.name,
      email: user.email,
      college: user.college,
      degree: user.degree,
      targetRole: user.target_role,
      emailVerified: Boolean(user.email_verified)
    };

    const token = signToken(user);

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      user: userObj,
      token
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// Get currently authenticated user profile
router.get('/auth/me', (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// Verify email via 6-digit code or URL token
router.post('/auth/verify-email', async (req, res) => {
  try {
    const { email, token } = req.body;
    const targetEmail = (email || req.user?.email || '').trim().toLowerCase();

    if (!targetEmail) {
      return res.status(400).json({ error: 'Email address is required for verification.' });
    }

    const user = await dbGet('SELECT * FROM users WHERE LOWER(email) = ?', [targetEmail]);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (user.email_verified) {
      return res.json({ success: true, message: 'Your email address is already verified.', emailVerified: true });
    }

    // Check token if provided
    if (token && user.verification_token && user.verification_token.trim() !== token.trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Please check the code received in your email.' });
    }

    await dbRun(
      'UPDATE users SET email_verified = 1, verification_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    return res.json({
      success: true,
      message: 'Email address verified successfully. Your SkillMatch AI account is now fully active!',
      emailVerified: true
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Resend verification email
router.post('/auth/resend-verification', async (req, res) => {
  try {
    const targetEmail = (req.body.email || req.user?.email || '').trim().toLowerCase();
    const user = await dbGet('SELECT * FROM users WHERE LOWER(email) = ?', [targetEmail]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    await dbRun('UPDATE users SET verification_token = ? WHERE id = ?', [newCode, user.id]);

    const emailResult = await sendVerificationEmail({
      userId: user.id,
      name: user.name,
      email: user.email,
      credentialId: user.credential_id,
      token: newCode
    });

    return res.json({
      success: true,
      message: `Verification code dispatched to ${user.email}.`,
      previewUrl: emailResult.previewUrl
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get user personal email dispatch history (in-app email notification viewer)
router.get('/user/emails', async (req, res) => {
  try {
    const emailIdent = req.user?.email || 'demo@skillmatch.ai';
    const emails = await getUserEmails(emailIdent);
    return res.json({ success: true, emails });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 2. AI RESUME ANALYZER & DOCUMENT PARSER
// ============================================================================

// 1. Upload & Parse Resume Document
router.post('/resume/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume document provided. Please select a PDF, DOCX, or TXT file.' });
    }

    const targetRole = req.body.targetRole || req.user?.targetRole || 'Java Developer';
    const parsedDoc = await parseDocument(req.file.buffer, req.file.originalname, req.file.mimetype);
    const analysis = analyzeResume(parsedDoc.rawText, targetRole, req.file.originalname);

    // Persist under authenticated user ID
    await dbRun(
      `INSERT OR REPLACE INTO resumes (id, user_id, file_name, file_type, file_size, raw_text, parsed_json, target_role, analysis_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        analysis.id,
        req.user.id,
        req.file.originalname,
        parsedDoc.formatDetected,
        req.file.size,
        parsedDoc.rawText,
        JSON.stringify(analysis.parsedData),
        targetRole,
        JSON.stringify(analysis)
      ]
    );

    return res.json({
      success: true,
      fileInfo: {
        name: req.file.originalname,
        type: parsedDoc.formatDetected,
        sizeBytes: req.file.size,
        wordCount: parsedDoc.wordCount
      },
      analysis
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    return res.status(400).json({ error: err.message || 'Failed to parse resume document' });
  }
});

// 2. Paste Resume Text Directly
router.post('/resume/analyze-text', async (req, res) => {
  try {
    const { text, targetRole = req.user?.targetRole || 'Java Developer', sourceName = 'Pasted_Resume.txt' } = req.body;
    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide substantial resume text (minimum 20 characters) to analyze.' });
    }

    const analysis = analyzeResume(text, targetRole, sourceName);

    await dbRun(
      `INSERT OR REPLACE INTO resumes (id, user_id, file_name, file_type, file_size, raw_text, parsed_json, target_role, analysis_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        analysis.id,
        req.user.id,
        sourceName,
        'TXT',
        text.length,
        text,
        JSON.stringify(analysis.parsedData),
        targetRole,
        JSON.stringify(analysis)
      ]
    );

    return res.json({
      success: true,
      analysis
    });
  } catch (err) {
    console.error('[Analyze Text Error]', err);
    return res.status(400).json({ error: err.message || 'Failed to analyze resume text' });
  }
});

// 3. Get Current Active Resume Analysis for Authenticated User
router.get('/resume/current', async (req, res) => {
  try {
    const row = await dbGet(
      'SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    if (row && row.analysis_json) {
      return res.json({ success: true, analysis: JSON.parse(row.analysis_json) });
    }

    // Fallback to any recent resume if user is demo or newly registered
    const anyRow = await dbGet('SELECT * FROM resumes ORDER BY created_at DESC LIMIT 1');
    if (anyRow && anyRow.analysis_json) {
      return res.json({ success: true, analysis: JSON.parse(anyRow.analysis_json) });
    }

    return res.json({ success: false, message: 'No resume analyzed yet' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Project Working-Phase Check & Evidence Evaluation
router.post('/projects/verify', async (req, res) => {
  try {
    const {
      projectName,
      githubUrl,
      documentation,
      architectureNotes,
      hasDb,
      hasApi,
      hasAuth,
      hasTesting,
      hasDeploy
    } = req.body;

    if (!projectName) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    let classification = 'Partially Functional';
    const evidenceNotes = [];

    if (hasDb && hasApi && hasAuth && hasDeploy) {
      classification = 'Production-Oriented / Complete Workflow';
      evidenceNotes.push('Integrated persistent database, verified RESTful API, token authentication, and cloud deployment.');
    } else if (hasDb && hasApi && hasAuth) {
      classification = 'Functional';
      evidenceNotes.push('Complete client-server data flow and secure authentication verified.');
    } else if (hasDb || hasApi) {
      classification = 'Partially Functional';
      evidenceNotes.push('Backend or database module present; lacks full deployment or authentication integration.');
    } else {
      classification = 'Prototype / Script';
      evidenceNotes.push('Limited evidence of multi-tier architectural integration.');
    }

    if (githubUrl && /github\.com/i.test(githubUrl)) {
      evidenceNotes.push('Public source code repository provided for commit inspection.');
    } else {
      evidenceNotes.push('No public repository link provided to verify code cleanliness.');
    }

    const verificationId = 'proj-v-' + Date.now();
    await dbRun(
      `INSERT INTO project_verifications (id, resume_id, project_name, github_url, documentation, architecture_notes, has_db_connection, has_api_integration, has_authentication, has_testing, has_deployment, classification, evidence_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        verificationId,
        req.user.id,
        projectName,
        githubUrl || '',
        documentation || '',
        architectureNotes || '',
        hasDb ? 1 : 0,
        hasApi ? 1 : 0,
        hasAuth ? 1 : 0,
        hasTesting ? 1 : 0,
        hasDeploy ? 1 : 0,
        classification,
        JSON.stringify(evidenceNotes)
      ]
    );

    return res.json({
      success: true,
      verification: {
        id: verificationId,
        projectName,
        classification,
        evidenceNotes,
        scores: {
          backendIntegrity: hasApi ? 90 : 35,
          databaseIntegrity: hasDb ? 90 : 30,
          securityAuth: hasAuth ? 85 : 20,
          deploymentReady: hasDeploy ? 95 : 25
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Job Description Matcher
router.post('/jd/match', async (req, res) => {
  try {
    const { jdText, jobTitle = 'Target Role Opening', companyName = 'Hiring Organization' } = req.body;
    if (!jdText || jdText.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide a substantial job description (minimum 20 characters).' });
    }

    // Fetch user's resume skills
    const resumeRow = await dbGet('SELECT analysis_json FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
    const analysis = resumeRow ? JSON.parse(resumeRow.analysis_json) : null;

    const candidateSkills = analysis?.parsedData?.skills?.allSkillsFound || [
      'Java', 'SQL', 'Git', 'Data Structures', 'Python'
    ];
    const candidateProjects = analysis?.parsedData?.projects || [];

    const matchResult = matchJobDescription(jdText, candidateSkills, candidateProjects);

    const jdMatchId = 'jdm-' + Date.now();
    await dbRun(
      `INSERT INTO jd_matches (id, resume_id, job_title, company_name, jd_text, match_score, matched_skills_json, missing_skills_json, recommendations_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        jdMatchId,
        req.user.id,
        jobTitle,
        companyName,
        jdText,
        matchResult.matchScore,
        JSON.stringify(matchResult.skillsFoundInResume),
        JSON.stringify(matchResult.skillsMissingFromResume),
        JSON.stringify(matchResult.keywordAdvice)
      ]
    );

    return res.json({
      success: true,
      matchResult
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// 6. Resume Improvement Generator
router.post('/resume/improve', async (req, res) => {
  try {
    const resumeRow = await dbGet('SELECT analysis_json FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
    const analysis = resumeRow ? JSON.parse(resumeRow.analysis_json) : null;

    if (!analysis) {
      return res.status(400).json({ error: 'Please upload or paste a resume first before generating improvements.' });
    }

    const targetRole = req.body.targetRole || analysis.targetRole || 'Java Developer';
    const improvements = generateResumeImprovements(analysis.parsedData, targetRole);

    return res.json({
      success: true,
      improvements
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 3. AI VOICE INTERVIEW AGENT — REAL-TIME CONVERSATIONAL INTERVIEWS
// ============================================================================

// Start Interactive Voice Interview Session
router.post('/interview/interactive/start', async (req, res) => {
  try {
    const {
      interviewType = 'Mixed Interview',
      targetRole = req.user?.targetRole || 'Java Developer',
      experienceLevel = 'Fresher',
      difficulty = 'Intermediate',
      totalQuestions = 5,
      focusTopics = []
    } = req.body;

    // Fetch user's current resume
    const resumeRow = await dbGet('SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
    let resumeData = null;

    if (resumeRow && resumeRow.analysis_json) {
      resumeData = JSON.parse(resumeRow.analysis_json);
    } else {
      // Create baseline candidate profile from authenticated user info
      resumeData = {
        id: 'usr-prof-' + req.user.id,
        targetRole,
        parsedData: {
          contact: { name: req.user.name, email: req.user.email },
          education: [{ degree: req.user.degree, college: req.user.college }],
          skills: { allSkillsFound: ['Java', 'SQL', 'Data Structures', 'OOP', 'Git', 'Problem Solving'] },
          projects: [{ name: 'Enterprise Management System', technologies: ['Java', 'Spring Boot', 'SQL'] }]
        }
      };
    }

    const sessionInit = await startInterviewSession({
      userId: req.user.id,
      resumeData,
      interviewType,
      targetRole,
      experienceLevel,
      difficulty,
      totalQuestions: parseInt(totalQuestions, 10) || 5,
      focusTopics
    });

    return res.json({
      success: true,
      ...sessionInit
    });
  } catch (err) {
    console.error('[Interview Start Error]', err);
    return res.status(400).json({ error: err.message || 'Failed to start AI Voice Interview session.' });
  }
});

// Submit Candidate Spoken/Typed Answer and Advance Turn
router.post('/interview/interactive/turn', async (req, res) => {
  try {
    const { sessionId, userAnswer, timeTakenSeconds } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required.' });
    }

    const result = await submitAnswerAndGetNextTurn({
      sessionId,
      userAnswer: userAnswer || '[Candidate provided no audible response]',
      timeTakenSeconds: timeTakenSeconds || 30
    });

    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('[Interview Turn Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

// Get Conceptual Question Hint
router.post('/interview/interactive/hint', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const hintData = await getQuestionHint({ sessionId });
    return res.json({ success: true, ...hintData });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Skip Active Question
router.post('/interview/interactive/skip', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const result = await skipInterviewQuestion({ sessionId });
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Finish Interview Early & Compile Final Evaluation Report
router.post('/interview/interactive/finish', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const sessionRow = await dbGet('SELECT * FROM interview_sessions WHERE id = ?', [sessionId]);
    if (!sessionRow) {
      return res.status(404).json({ error: 'Interview session not found.' });
    }

    const sessionState = JSON.parse(sessionRow.session_data_json);
    sessionState.status = 'completed';
    sessionState.completedAt = new Date().toISOString();

    const finalReport = compileFinalInterviewReport(sessionState);
    await saveAndNotifyEvaluation(sessionState, finalReport);

    return res.json({
      success: true,
      finalReport,
      isCompleted: true
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get User's Past Interview Sessions & Performance Reports
router.get('/interview/history', async (req, res) => {
  try {
    const evaluations = await dbAll(
      `SELECT e.*, s.total_questions, s.interview_type, s.difficulty 
       FROM interview_evaluations e
       LEFT JOIN interview_sessions s ON e.session_id = s.id
       WHERE e.user_id = ?
       ORDER BY e.created_at DESC LIMIT 20`,
      [req.user.id]
    );

    const parsedEvaluations = evaluations.map(e => ({
      id: e.id,
      sessionId: e.session_id,
      targetRole: e.target_role,
      overallScore: e.overall_score,
      communicationScore: e.communication_score,
      technicalScore: e.technical_score,
      problemSolvingScore: e.problem_solving_score,
      interviewType: e.interview_type || 'Technical',
      difficulty: e.difficulty || 'Intermediate',
      totalQuestions: e.total_questions || 5,
      createdAt: e.created_at,
      report: JSON.parse(e.evaluation_json || '{}')
    }));

    return res.json({ success: true, evaluations: parsedEvaluations });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 4. LEARNING & DEVELOPMENT AND PROGRESS TRACKING
// ============================================================================

// Get Dynamic Roadmap
router.get('/roadmap', async (req, res) => {
  try {
    const targetRole = req.query.role || req.user?.targetRole || 'Java Developer';
    const resumeRow = await dbGet('SELECT analysis_json FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
    const analysis = resumeRow ? JSON.parse(resumeRow.analysis_json) : null;

    const missingSkills = analysis?.skillGaps
      ?.filter(g => g.gap.includes('High') || g.gap.includes('Medium'))
      ?.map(g => g.skill) || ['Spring Boot', 'REST APIs', 'Docker'];

    const roadmap = generateDynamicRoadmap(missingSkills, targetRole);
    return res.json({ success: true, roadmap });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// User Learning Progress
router.get('/learning/progress', async (req, res) => {
  try {
    const records = await dbAll('SELECT * FROM user_learning_progress WHERE user_id = ?', [req.user.id]);
    return res.json({ success: true, progress: records });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/learning/progress', async (req, res) => {
  try {
    const { itemId, itemType = 'course', status = 'completed' } = req.body;
    if (!itemId) return res.status(400).json({ error: 'itemId is required.' });

    const id = `prog-${req.user.id}-${itemId}`;
    await dbRun(
      `INSERT INTO user_learning_progress (id, user_id, item_id, item_type, status, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, item_id) DO UPDATE SET status = ?, updated_at = CURRENT_TIMESTAMP`,
      [id, req.user.id, itemId, itemType, status, status]
    );

    return res.json({ success: true, message: 'Learning progress recorded.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 5. SAVED JOBS & CAREER OPPORTUNITIES
// ============================================================================

router.get('/jobs/saved', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM user_saved_jobs WHERE user_id = ? ORDER BY saved_at DESC', [req.user.id]);
    const jobs = rows.map(r => JSON.parse(r.job_data_json));
    return res.json({ success: true, savedJobs: jobs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/jobs/save', async (req, res) => {
  try {
    const { job } = req.body;
    if (!job || !job.id) return res.status(400).json({ error: 'Valid job object with id is required.' });

    const id = `sj-${req.user.id}-${job.id}`;
    await dbRun(
      `INSERT INTO user_saved_jobs (id, user_id, job_id, job_data_json, saved_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, job_id) DO UPDATE SET saved_at = CURRENT_TIMESTAMP`,
      [id, req.user.id, job.id, JSON.stringify(job)]
    );

    return res.json({ success: true, message: 'Job saved to your bookmarks.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/jobs/save/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    await dbRun('DELETE FROM user_saved_jobs WHERE user_id = ? AND job_id = ?', [req.user.id, jobId]);
    return res.json({ success: true, message: 'Job removed from bookmarks.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Companies & Target Roles
router.get('/companies', (req, res) => {
  return res.json({ success: true, companies: COMPANY_CATALOG });
});

router.get('/roles', (req, res) => {
  return res.json({ success: true, roles: Object.values(ROLE_BENCHMARKS) });
});

export default router;
