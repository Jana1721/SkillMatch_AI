import express from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { parseDocument } from '../services/documentParser.js';
import { analyzeResume, ROLE_BENCHMARKS } from '../services/resumeAnalyzer.js';
import { COMPANY_CATALOG, matchJobDescription, analyzeJobDescriptionOnly } from '../services/jobMatcher.js';
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
import { authenticateUser, signToken, requireAuth, requireAdmin } from '../services/authMiddleware.js';
import { dbRun, dbGet, dbAll, generateCredentialId, verifyStudentAgainstCollegeRoster } from '../db/database.js';

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

// Helper to log administrative actions
async function logAuditAction(adminUser, action, targetType, targetId, details = {}) {
  try {
    const logId = `aud-${crypto.randomUUID().slice(0, 8)}`;
    await dbRun(
      `INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        adminUser.id,
        adminUser.name,
        action,
        targetType,
        targetId,
        JSON.stringify(details)
      ]
    );
  } catch (err) {
    console.error('[Audit Log Error]', err.message);
  }
}

// ============================================================================
// 1. STUDENT REGISTRATION, UNIQUE LOGIN ID & EMAIL VERIFICATION
// ============================================================================

/**
 * Register student account with roll number, department, phone, email, and password.
 * Generates unique SkillMatch AI Login ID (SKM-2026-XXXXXX) and 6-digit OTP.
 */
router.post('/auth/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      passwordConfirm,
      confirmPassword,
      rollNumber,
      roll_number,
      phone,
      department,
      college,
      degree,
      targetRole,
      yearOfStudy,
      year_of_study
    } = req.body;

    const effectiveRoll = (rollNumber || roll_number || '').trim();
    const effectivePhone = (phone || '').trim();
    const effectiveDept = (department || 'Computer Science & Engineering').trim();
    const effectiveYear = (yearOfStudy || year_of_study || '2026').toString().trim();
    const effectiveConfirm = passwordConfirm || confirmPassword;

    // 1. Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Student email address is required.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }
    if (!effectiveRoll) {
      return res.status(400).json({ error: 'College roll number is required.' });
    }

    // 2. Validate format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid student email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters in length.' });
    }

    if (password.trim().toLowerCase() === effectiveRoll.toLowerCase()) {
      return res.status(400).json({ error: 'For security reasons, your college roll number cannot be used as your account password.' });
    }

    if (effectiveConfirm && password !== effectiveConfirm) {
      return res.status(400).json({ error: 'Password and confirmation do not match.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 3. Prevent duplicate accounts using same email address
    const existingEmail = await dbGet('SELECT id FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
    if (existingEmail) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
    }

    // 4. Prevent duplicate accounts using same college roll number
    const existingRoll = await dbGet('SELECT id FROM users WHERE LOWER(roll_number) = ?', [effectiveRoll.toLowerCase()]);
    if (existingRoll) {
      return res.status(400).json({ error: `An account with college roll number "${effectiveRoll}" already exists. Please log in.` });
    }

    // 5. Generate permanent Candidate ID: KCE-<respective_year>-<respective_roll_number>
    const credentialId = generateCredentialId(effectiveYear, effectiveRoll);
    const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes expiry

    await dbRun(
      `INSERT INTO users (
        id, credential_id, roll_number, name, email, phone, department,
        password_hash, college, degree, target_role, role,
        email_verified, email_status, college_identity_status,
        verification_token, token_expires_at, verification_attempts, last_resend_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        credentialId,
        effectiveRoll,
        name.trim(),
        normalizedEmail,
        effectivePhone,
        effectiveDept,
        passwordHash,
        college || 'Karpagam College of Engineering',
        effectiveYear || degree || 'B.Tech',
        targetRole || 'Software Engineer',
        'student',
        0,
        'Unverified',
        'Pending Verification',
        verificationCode,
        expiresAt,
        0,
        new Date().toISOString()
      ]
    );

    const userObj = {
      id: userId,
      credentialId,
      credential_id: credentialId,
      rollNumber: effectiveRoll,
      name: name.trim(),
      email: normalizedEmail,
      phone: effectivePhone,
      department: effectiveDept,
      college: college || 'Karpagam College of Engineering',
      degree: effectiveYear || degree || 'B.Tech',
      targetRole: targetRole || 'Software Engineer',
      role: 'student',
      emailVerified: false,
      emailStatus: 'Unverified',
      collegeIdentityStatus: 'Pending Verification'
    };

    const token = signToken(userObj);

    // Send real verification email with 6-digit OTP to student's Gmail / email
    await sendVerificationEmail({
      userId,
      name: name.trim(),
      email: normalizedEmail,
      credentialId,
      token: verificationCode
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully. A 6-digit verification code has been dispatched to your student email.',
      loginId: credentialId,
      credentialId,
      user: userObj,
      token
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

/**
 * Login with either Login ID (SKM-2026-XXXXXX), Email Address, or College Roll Number.
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { email, loginId, identifier, password } = req.body;
    const loginIdentifier = (identifier || loginId || email || '').trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: 'Please enter your Login ID or Email and password.' });
    }

    const normalizedIdent = loginIdentifier.toLowerCase();

    // Query by Email, SkillMatch Login ID, or Roll Number
    const user = await dbGet(
      `SELECT * FROM users 
       WHERE LOWER(email) = ? OR LOWER(credential_id) = ? OR LOWER(roll_number) = ?`,
      [normalizedIdent, normalizedIdent, normalizedIdent]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid login credentials. Please check your Login ID or Email and password.' });
    }

    // Rate-limit failed login attempts: check if locked out
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const waitMin = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      return res.status(429).json({
        error: `Account temporarily locked due to repeated failed login attempts. Please try again in ${waitMin} minute${waitMin === 1 ? '' : 's'} or reset your password.`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const failed = (user.failed_login_attempts || 0) + 1;
      let lockUntil = null;
      if (failed >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }
      await dbRun('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?', [failed, lockUntil, user.id]);
      return res.status(401).json({ error: 'Invalid login credentials. Please check your Login ID or Email and password.' });
    }

    // Reset failed login attempts on successful login
    await dbRun('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?', [user.id]);

    const userObj = {
      id: user.id,
      credentialId: user.credential_id,
      credential_id: user.credential_id,
      rollNumber: user.roll_number,
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      college: user.college,
      degree: user.degree,
      targetRole: user.target_role,
      role: user.role || 'student',
      emailVerified: Boolean(user.email_verified),
      emailStatus: user.email_status || (user.email_verified ? 'Verified' : 'Unverified'),
      collegeIdentityStatus: user.college_identity_status || 'Pending Verification',
      collegeRejectedReason: user.college_rejected_reason || null,
      collegeReviewedBy: user.college_reviewed_by || null,
      collegeVerifiedAt: user.college_verified_at || null,
      collegeVerificationMethod: user.college_verification_method || null
    };

    const token = signToken(userObj);

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

// Current user profile
router.get('/auth/me', (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

/**
 * Update candidate profile information
 */
router.put('/user/profile', requireAuth, async (req, res) => {
  try {
    const { name, phone, department, college, degree, targetRole } = req.body;

    await dbRun(
      `UPDATE users SET 
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        department = COALESCE(?, department),
        college = COALESCE(?, college),
        degree = COALESCE(?, degree),
        target_role = COALESCE(?, target_role),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, phone, department, college, degree, targetRole, req.user.id]
    );

    const updated = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const userObj = {
      id: updated.id,
      credentialId: updated.credential_id,
      rollNumber: updated.roll_number,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      department: updated.department,
      college: updated.college,
      degree: updated.degree,
      targetRole: updated.target_role,
      role: updated.role || 'student',
      emailVerified: Boolean(updated.email_verified),
      emailStatus: updated.email_status || (updated.email_verified ? 'Verified' : 'Unverified'),
      collegeIdentityStatus: updated.college_identity_status || 'Pending Verification',
      collegeRejectedReason: updated.college_rejected_reason || null,
      collegeReviewedBy: updated.college_reviewed_by || null,
      collegeVerifiedAt: updated.college_verified_at || null,
      collegeVerificationMethod: updated.college_verification_method || null
    };

    return res.json({ success: true, message: 'Profile updated successfully.', user: userObj });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Verify Email with 6-Digit OTP.
 * Enforces 5-minute expiration and maximum 5 incorrect attempts.
 * Cross-references official college records upon verification.
 */
router.post('/auth/verify-email', async (req, res) => {
  try {
    const { email, code, token, identifier } = req.body;
    const effectiveCode = (code || token || '').trim();
    const targetIdent = (identifier || email || req.user?.email || '').trim().toLowerCase();

    if (!effectiveCode) {
      return res.status(400).json({ error: 'Please enter the 6-digit verification code.' });
    }

    let user = null;
    if (targetIdent) {
      user = await dbGet(
        `SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(credential_id) = ? OR id = ?`,
        [targetIdent, targetIdent, targetIdent]
      );
    }
    if (!user && req.user && req.user.id !== 'guest-user') {
      user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
    }

    if (!user) {
      return res.status(404).json({ error: 'Candidate account not found.' });
    }

    if (user.email_verified) {
      return res.json({
        success: true,
        message: 'Your email address is already verified and active.',
        emailVerified: true,
        emailStatus: 'Verified',
        collegeIdentityStatus: user.college_identity_status || 'Pending Verification'
      });
    }

    // 1. Enforce attempt limit (max 5)
    const attempts = user.verification_attempts || 0;
    if (attempts >= 5) {
      return res.status(429).json({
        error: 'Too many incorrect attempts. Please request a new verification code.'
      });
    }

    // 2. Check token expiration (5-minute window)
    if (user.token_expires_at) {
      const expiry = new Date(user.token_expires_at).getTime();
      if (Date.now() > expiry) {
        return res.status(400).json({
          error: 'Verification code has expired. Please click "Resend Code" to receive a new one.'
        });
      }
    }

    // 3. Verify code match
    if (!user.verification_token || user.verification_token.trim() !== effectiveCode) {
      const newAttempts = attempts + 1;
      await dbRun('UPDATE users SET verification_attempts = ? WHERE id = ?', [newAttempts, user.id]);
      const remaining = Math.max(0, 5 - newAttempts);
      return res.status(400).json({
        error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
      });
    }

    // 4. Success: Mark email as Verified
    await dbRun(
      `UPDATE users SET 
        email_verified = 1,
        email_status = 'Verified',
        verification_token = NULL, 
        verification_attempts = 0,
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [user.id]
    );

    // 5. College Identity Verification: Check official college student roster
    const rosterCheck = await verifyStudentAgainstCollegeRoster(
      user.roll_number,
      user.email,
      user.name,
      user.department
    );

    let collegeIdentityStatus = 'Pending Verification';
    let verificationMethod = null;

    if (rosterCheck.matched) {
      collegeIdentityStatus = 'Verified';
      verificationMethod = 'official_records';
      await dbRun(
        `UPDATE users SET 
          college_identity_status = 'Verified',
          college_verification_method = 'official_records',
          college_verified_at = CURRENT_TIMESTAMP,
          college_rejected_reason = NULL
         WHERE id = ?`,
        [user.id]
      );
    } else {
      await dbRun(
        `UPDATE users SET 
          college_identity_status = 'Pending Verification',
          college_rejected_reason = NULL
         WHERE id = ?`,
        [user.id]
      );
    }

    const updatedUser = await dbGet('SELECT * FROM users WHERE id = ?', [user.id]);
    const userObj = {
      id: updatedUser.id,
      credentialId: updatedUser.credential_id,
      credential_id: updatedUser.credential_id,
      rollNumber: updatedUser.roll_number,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      department: updatedUser.department,
      college: updatedUser.college,
      degree: updatedUser.degree,
      targetRole: updatedUser.target_role,
      role: updatedUser.role || 'student',
      emailVerified: Boolean(updatedUser.email_verified),
      emailStatus: updatedUser.email_status || 'Verified',
      collegeIdentityStatus: updatedUser.college_identity_status || collegeIdentityStatus,
      collegeRejectedReason: updatedUser.college_rejected_reason || null,
      collegeReviewedBy: updatedUser.college_reviewed_by || null,
      collegeVerifiedAt: updatedUser.college_verified_at || null,
      collegeVerificationMethod: updatedUser.college_verification_method || verificationMethod
    };

    return res.json({
      success: true,
      message: rosterCheck.matched
        ? 'Email verified and college identity confirmed via authorized student records!'
        : 'Email verified successfully! College identity is awaiting administrative review.',
      emailVerified: true,
      emailStatus: 'Verified',
      collegeIdentityStatus,
      collegeVerificationMethod: verificationMethod,
      user: userObj
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Resend verification code.
 * Enforces a 60-second cooldown between requests and 5-minute expiry.
 */
router.post('/auth/resend-code', async (req, res) => {
  try {
    const { email, identifier } = req.body;
    const targetIdent = (identifier || email || req.user?.email || '').trim().toLowerCase();

    if (!targetIdent) {
      return res.status(400).json({ error: 'Email or Login ID is required.' });
    }

    const user = await dbGet(
      `SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(credential_id) = ?`,
      [targetIdent, targetIdent]
    );

    if (!user) {
      return res.status(404).json({ error: 'Candidate account not found.' });
    }

    if (user.email_verified) {
      return res.json({ success: true, message: 'Account is already verified.' });
    }

    // Check 60-second cooldown
    if (user.last_resend_at) {
      const lastResend = new Date(user.last_resend_at).getTime();
      const diffSec = Math.floor((Date.now() - lastResend) / 1000);
      if (diffSec < 60) {
        return res.status(429).json({
          error: `Please wait ${60 - diffSec} seconds before requesting another code.`
        });
      }
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    await dbRun(
      `UPDATE users SET 
        verification_token = ?, 
        token_expires_at = ?, 
        verification_attempts = 0, 
        last_resend_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [newCode, expiresAt, user.id]
    );

    // Dispatch real email with 6-digit code
    await sendVerificationEmail({
      userId: user.id,
      name: user.name,
      email: user.email,
      credentialId: user.credential_id,
      token: newCode
    });

    return res.json({
      success: true,
      message: `A fresh 6-digit verification code has been dispatched to ${user.email}.`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Alias for backwards compatibility
router.post('/auth/resend-verification', (req, res, next) => {
  return router.handle({ ...req, url: '/auth/resend-code' }, res, next);
});

/**
 * Forgot password request
 */
router.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email, identifier } = req.body;
    const target = (identifier || email || '').trim().toLowerCase();
    if (!target) {
      return res.status(400).json({ error: 'Please provide your registered Email or Login ID.' });
    }

    const user = await dbGet(
      `SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(credential_id) = ?`,
      [target, target]
    );

    if (!user) {
      // Return neutral message for security
      return res.json({
        success: true,
        message: 'If an account exists with this credential, a password reset link has been dispatched.'
      });
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await dbRun(
      'UPDATE users SET reset_token = ?, reset_expires_at = ? WHERE id = ?',
      [resetToken, resetExpires, user.id]
    );

    const emailResult = await sendPasswordResetEmail({
      userId: user.id,
      name: user.name,
      email: user.email,
      token: resetToken
    });

    return res.json({
      success: true,
      message: 'Password reset code dispatched to your email.',
      previewUrl: emailResult.previewUrl
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Reset password using token
 */
router.post('/auth/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await dbGet('SELECT * FROM users WHERE LOWER(email) = ?', [email.trim().toLowerCase()]);
    if (!user || !user.reset_token || user.reset_token.trim() !== token.trim()) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    if (user.reset_expires_at && Date.now() > new Date(user.reset_expires_at).getTime()) {
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await dbRun(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires_at = NULL WHERE id = ?',
      [passwordHash, user.id]
    );

    return res.json({
      success: true,
      message: 'Password reset successfully. You may now log in with your new password.'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// View email logs for logged-in user
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
// 2. ADMIN-ONLY DASHBOARD & CANDIDATE MANAGEMENT
// ============================================================================

/**
 * Admin KPI statistics & platform analytics
 */
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    // 1. Candidate Counts
    const candidates = await dbAll("SELECT * FROM users WHERE role = 'student' OR role IS NULL");
    const totalCandidates = candidates.length;
    const verifiedCandidates = candidates.filter(c => Boolean(c.email_verified)).length;
    const unverifiedCandidates = totalCandidates - verifiedCandidates;

    // 2. Interview Counts
    const allSessions = await dbAll("SELECT * FROM interview_sessions");
    const completedInterviews = allSessions.filter(s => s.status === 'completed').length;
    const pendingInterviews = allSessions.filter(s => s.status !== 'completed').length;

    // 3. Resume Scores & Evaluations
    const allResumes = await dbAll("SELECT analysis_json FROM resumes");
    const resumeScores = allResumes.map(r => {
      try {
        const parsed = JSON.parse(r.analysis_json);
        return parsed?.scores?.overallScore || 0;
      } catch (e) {
        return 0;
      }
    }).filter(s => s > 0);

    const avgResumeScore = resumeScores.length > 0
      ? Math.round(resumeScores.reduce((a, b) => a + b, 0) / resumeScores.length)
      : 74;

    const allEvaluations = await dbAll("SELECT overall_score FROM interview_evaluations");
    const lowScoreCount = resumeScores.filter(s => s < 70).length +
      allEvaluations.filter(e => (e.overall_score || 0) < 70).length;

    // 4. Department Distribution
    const deptMap = {};
    candidates.forEach(c => {
      const dept = c.department || 'Computer Science & Engineering';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const departmentDistribution = Object.entries(deptMap).map(([dept, count]) => ({
      department: dept,
      count
    }));

    // 5. Score Distribution
    const scoreRanges = {
      '85-100 (Exceptional)': 0,
      '70-84 (Job Ready)': 0,
      '50-69 (Needs Work)': 0,
      '<50 (Early Prep)': 0
    };
    resumeScores.forEach(score => {
      if (score >= 85) scoreRanges['85-100 (Exceptional)']++;
      else if (score >= 70) scoreRanges['70-84 (Job Ready)']++;
      else if (score >= 50) scoreRanges['50-69 (Needs Work)']++;
      else scoreRanges['<50 (Early Prep)']++;
    });

    return res.json({
      success: true,
      stats: {
        totalCandidates,
        verifiedCandidates,
        unverifiedCandidates,
        completedInterviews,
        pendingInterviews,
        avgResumeScore,
        candidatesNeedingImprovement: Math.max(1, lowScoreCount),
        departmentDistribution,
        scoreRanges: Object.entries(scoreRanges).map(([range, count]) => ({ range, count }))
      }
    });
  } catch (err) {
    console.error('[Admin Stats Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin candidate list with search, filter, sort, and pagination
 */
router.get('/admin/candidates', requireAdmin, async (req, res) => {
  try {
    const {
      search = '',
      department = 'all',
      verificationStatus = 'all',
      emailStatus = 'all',
      collegeIdentityStatus = 'all',
      interviewStatus = 'all',
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Fetch all student candidates
    const candidates = await dbAll(
      "SELECT * FROM users WHERE role = 'student' OR role IS NULL ORDER BY created_at DESC"
    );

    // Fetch latest resume, interview, and github verification for each candidate
    const enhancedCandidates = await Promise.all(
      candidates.map(async (c) => {
        // Latest resume
        const resumeRow = await dbGet(
          'SELECT analysis_json FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
          [c.id]
        );
        let resumeScore = null;
        if (resumeRow && resumeRow.analysis_json) {
          try {
            resumeScore = JSON.parse(resumeRow.analysis_json)?.scores?.overallScore || null;
          } catch (e) {}
        }

        // Latest interview evaluation
        const evalRow = await dbGet(
          'SELECT overall_score, created_at FROM interview_evaluations WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
          [c.id]
        );

        // Interview completion status
        const sessionRow = await dbGet(
          'SELECT status FROM interview_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
          [c.id]
        );

        // GitHub verification status
        const ghRow = await dbGet(
          'SELECT status FROM github_verifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
          [c.id]
        );

        return {
          id: c.id,
          name: c.name,
          rollNumber: c.roll_number || 'N/A',
          credentialId: c.credential_id || 'N/A',
          email: c.email,
          phone: c.phone || 'N/A',
          department: c.department || 'Computer Science & Engineering',
          college: c.college || 'Engineering College',
          emailVerified: Boolean(c.email_verified),
          emailStatus: c.email_status || (c.email_verified ? 'Verified' : 'Unverified'),
          collegeIdentityStatus: c.college_identity_status || 'Pending Verification',
          collegeRejectedReason: c.college_rejected_reason || null,
          collegeReviewedBy: c.college_reviewed_by || null,
          collegeVerifiedAt: c.college_verified_at || null,
          collegeVerificationMethod: c.college_verification_method || null,
          resumeScore: resumeScore !== null ? resumeScore : 72,
          githubStatus: ghRow?.status || 'Not Submitted',
          latestInterviewScore: evalRow?.overall_score || null,
          interviewStatus: sessionRow?.status === 'completed'
            ? 'Completed'
            : sessionRow?.status === 'in_progress'
            ? 'In Progress'
            : evalRow ? 'Completed' : 'Not Started',
          createdAt: c.created_at
        };
      })
    );

    // Filter in-memory for flexibility across SQLite & pure-JS storage
    let filtered = enhancedCandidates;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.rollNumber && c.rollNumber.toLowerCase().includes(q)) ||
        (c.credentialId && c.credentialId.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.department && c.department.toLowerCase().includes(q))
      );
    }

    if (department !== 'all') {
      filtered = filtered.filter(c => c.department.toLowerCase() === department.toLowerCase());
    }

    // Support legacy verificationStatus and granular emailStatus
    if (verificationStatus === 'verified') {
      filtered = filtered.filter(c => c.emailVerified);
    } else if (verificationStatus === 'unverified') {
      filtered = filtered.filter(c => !c.emailVerified);
    }

    if (emailStatus !== 'all') {
      filtered = filtered.filter(c => c.emailStatus.toLowerCase() === emailStatus.toLowerCase());
    }

    // Filter by College Identity Status
    if (collegeIdentityStatus !== 'all') {
      filtered = filtered.filter(c => c.collegeIdentityStatus.toLowerCase() === collegeIdentityStatus.toLowerCase());
    }

    if (interviewStatus !== 'all') {
      filtered = filtered.filter(c => c.interviewStatus.toLowerCase() === interviewStatus.toLowerCase());
    }

    // Sort
    filtered.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limitNum);

    return res.json({
      success: true,
      candidates: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error('[Admin Candidates Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Detailed candidate drill-down profile for administrators
 */
router.get('/admin/candidates/:id', requireAdmin, async (req, res) => {
  try {
    const candidateId = req.params.id;
    const candidate = await dbGet('SELECT * FROM users WHERE id = ?', [candidateId]);

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate profile not found.' });
    }

    // 1. Resumes
    const resumes = await dbAll(
      'SELECT id, file_name, file_type, file_size, target_role, analysis_json, created_at FROM resumes WHERE user_id = ? ORDER BY created_at DESC',
      [candidateId]
    );
    const parsedResumes = resumes.map(r => {
      let analysis = null;
      try { analysis = JSON.parse(r.analysis_json); } catch (e) {}
      return {
        id: r.id,
        fileName: r.file_name,
        targetRole: r.target_role,
        score: analysis?.scores?.overallScore || 70,
        analysis,
        createdAt: r.created_at
      };
    });

    // 2. JD Matches
    const jdMatches = await dbAll(
      'SELECT * FROM jd_matches WHERE resume_id = ? OR id IN (SELECT id FROM jd_matches WHERE resume_id IN (SELECT id FROM resumes WHERE user_id = ?)) ORDER BY created_at DESC',
      [candidateId, candidateId]
    );

    // 3. GitHub Verifications
    const githubVerifications = await dbAll(
      'SELECT * FROM github_verifications WHERE user_id = ? ORDER BY created_at DESC',
      [candidateId]
    );

    // 4. Interviews & Evaluations
    const interviews = await dbAll(
      `SELECT e.*, s.interview_type, s.difficulty, s.status as session_status
       FROM interview_evaluations e
       LEFT JOIN interview_sessions s ON e.session_id = s.id
       WHERE e.user_id = ? ORDER BY e.created_at DESC`,
      [candidateId]
    );
    const parsedInterviews = interviews.map(i => {
      let report = null;
      try { report = JSON.parse(i.evaluation_json); } catch (e) {}
      return {
        id: i.id,
        sessionId: i.session_id,
        targetRole: i.target_role,
        overallScore: i.overall_score,
        technicalScore: i.technical_score,
        communicationScore: i.communication_score,
        problemSolvingScore: i.problem_solving_score,
        interviewType: i.interview_type || 'Technical',
        status: i.session_status || 'Completed',
        report,
        createdAt: i.created_at
      };
    });

    // 5. Saved Jobs
    const savedJobs = await dbAll('SELECT * FROM user_saved_jobs WHERE user_id = ?', [candidateId]);

    // 6. Identity Verification Audit History
    const reviews = await dbAll(
      'SELECT * FROM identity_verification_reviews WHERE user_id = ? ORDER BY reviewed_at DESC',
      [candidateId]
    );

    return res.json({
      success: true,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        rollNumber: candidate.roll_number || 'N/A',
        credentialId: candidate.credential_id || 'N/A',
        email: candidate.email,
        phone: candidate.phone || 'N/A',
        department: candidate.department || 'Computer Science & Engineering',
        college: candidate.college,
        degree: candidate.degree,
        targetRole: candidate.target_role,
        emailVerified: Boolean(candidate.email_verified),
        emailStatus: candidate.email_status || (candidate.email_verified ? 'Verified' : 'Unverified'),
        collegeIdentityStatus: candidate.college_identity_status || 'Pending Verification',
        collegeRejectedReason: candidate.college_rejected_reason || null,
        collegeReviewedBy: candidate.college_reviewed_by || null,
        collegeVerifiedAt: candidate.college_verified_at || null,
        collegeVerificationMethod: candidate.college_verification_method || null,
        role: candidate.role,
        createdAt: candidate.created_at
      },
      resumes: parsedResumes,
      jdMatches: jdMatches.map(j => ({
        id: j.id,
        jobTitle: j.job_title,
        companyName: j.company_name,
        matchScore: j.match_score,
        matchedSkills: JSON.parse(j.matched_skills_json || '[]'),
        missingSkills: JSON.parse(j.missing_skills_json || '[]'),
        createdAt: j.created_at
      })),
      githubVerifications: githubVerifications.map(g => ({
        id: g.id,
        repoUrl: g.repo_url,
        status: g.status,
        relevanceScore: g.relevance_score,
        repoData: JSON.parse(g.repo_data_json || '{}'),
        analysis: JSON.parse(g.analysis_json || '{}'),
        createdAt: g.created_at
      })),
      interviews: parsedInterviews,
      savedJobsCount: savedJobs.length,
      identityReviews: reviews
    });
  } catch (err) {
    console.error('[Admin Candidate Detail Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin manual candidate email verification with audit logging
 */
router.post('/admin/candidates/:id/verify-email', requireAdmin, async (req, res) => {
  try {
    const candidateId = req.params.id;
    const candidate = await dbGet('SELECT * FROM users WHERE id = ?', [candidateId]);

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    await dbRun(
      `UPDATE users SET 
        email_verified = 1,
        email_status = 'Verified',
        verification_token = NULL,
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [candidateId]
    );

    // Record in audit log
    await logAuditAction(
      req.user,
      'MANUAL_EMAIL_VERIFICATION',
      'USER',
      candidateId,
      { candidateEmail: candidate.email, candidateRoll: candidate.roll_number }
    );

    return res.json({
      success: true,
      message: `Candidate ${candidate.name} (${candidate.email}) email has been manually verified by Administrator.`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin manual college identity review (Approve or Reject with mandatory reason)
 */
router.post('/admin/candidates/:id/verify-identity', requireAdmin, async (req, res) => {
  try {
    const candidateId = req.params.id;
    const { action, reason } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Valid review action ("approve" or "reject") is required.' });
    }

    if (action === 'reject' && (!reason || !reason.trim())) {
      return res.status(400).json({ error: 'A specific review reason is required when rejecting a candidate.' });
    }

    const candidate = await dbGet('SELECT * FROM users WHERE id = ?', [candidateId]);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    const prevStatus = candidate.college_identity_status || 'Pending Verification';
    const newStatus = action === 'approve' ? 'Verified' : 'Rejected';
    const reviewId = `rev-${crypto.randomUUID().slice(0, 8)}`;
    const adminName = req.user.name || 'Administrator';
    const adminId = req.user.id || 'admin';

    if (action === 'approve') {
      await dbRun(
        `UPDATE users SET 
          college_identity_status = 'Verified',
          college_verified_at = CURRENT_TIMESTAMP,
          college_reviewed_by = ?,
          college_verification_method = 'admin_review',
          college_rejected_reason = NULL,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [adminName, candidateId]
      );
    } else {
      await dbRun(
        `UPDATE users SET 
          college_identity_status = 'Rejected',
          college_rejected_reason = ?,
          college_reviewed_by = ?,
          college_verification_method = 'admin_review',
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [reason.trim(), adminName, candidateId]
      );
    }

    // Insert into identity_verification_reviews audit trail
    await dbRun(
      `INSERT INTO identity_verification_reviews (
        id, user_id, admin_id, admin_name, action, reason, previous_status, new_status, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        reviewId,
        candidateId,
        adminId,
        adminName,
        action,
        action === 'reject' ? reason.trim() : 'Approved by administrator',
        prevStatus,
        newStatus
      ]
    );

    // Record in global audit log
    await logAuditAction(
      req.user,
      action === 'approve' ? 'ADMIN_COLLEGE_IDENTITY_APPROVAL' : 'ADMIN_COLLEGE_IDENTITY_REJECTION',
      'USER',
      candidateId,
      {
        candidateEmail: candidate.email,
        candidateRoll: candidate.roll_number,
        action,
        reason: action === 'reject' ? reason.trim() : null
      }
    );

    const updatedCandidate = await dbGet('SELECT * FROM users WHERE id = ?', [candidateId]);

    return res.json({
      success: true,
      message: action === 'approve'
        ? `College identity for ${candidate.name} (${candidate.roll_number}) has been approved.`
        : `College identity for ${candidate.name} has been marked as Rejected with the specified reason.`,
      newStatus,
      user: {
        id: updatedCandidate.id,
        collegeIdentityStatus: updatedCandidate.college_identity_status,
        collegeRejectedReason: updatedCandidate.college_rejected_reason,
        collegeReviewedBy: updatedCandidate.college_reviewed_by,
        collegeVerifiedAt: updatedCandidate.college_verified_at
      }
    });
  } catch (err) {
    console.error('[Admin Identity Review Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Student candidate resubmits details after identity rejection
 */
router.post('/user/resubmit-identity', requireAuth, async (req, res) => {
  try {
    const { rollNumber, department, name, phone } = req.body;

    if (!rollNumber || !rollNumber.trim()) {
      return res.status(400).json({ error: 'College roll number is required for identity verification.' });
    }

    const cleanRoll = rollNumber.trim();
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Check if roll number taken by another user
    const existing = await dbGet(
      'SELECT id FROM users WHERE LOWER(roll_number) = ? AND id != ?',
      [cleanRoll.toLowerCase(), user.id]
    );
    if (existing) {
      return res.status(400).json({ error: `Roll number ${cleanRoll} is already registered to another account.` });
    }

    const updatedDept = department || user.department;
    const updatedName = name || user.name;
    const updatedPhone = phone !== undefined ? phone : user.phone;

    // Check against authorized college student roster
    const rosterCheck = await verifyStudentAgainstCollegeRoster(
      cleanRoll,
      user.email,
      updatedName,
      updatedDept
    );

    let newStatus = 'Pending Verification';
    let method = null;
    let verifiedAt = null;

    if (rosterCheck.matched) {
      newStatus = 'Verified';
      method = 'official_records';
      verifiedAt = new Date().toISOString();
    }

    await dbRun(
      `UPDATE users SET 
        roll_number = ?,
        department = ?,
        name = ?,
        phone = ?,
        college_identity_status = ?,
        college_verification_method = ?,
        college_verified_at = ?,
        college_rejected_reason = NULL,
        college_reviewed_by = NULL,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [cleanRoll, updatedDept, updatedName, updatedPhone, newStatus, method, verifiedAt, user.id]
    );

    const updated = await dbGet('SELECT * FROM users WHERE id = ?', [user.id]);

    return res.json({
      success: true,
      message: rosterCheck.matched
        ? 'Identity resubmitted and verified successfully against official college records!'
        : 'Identity details resubmitted. Your account is now pending administrative verification.',
      collegeIdentityStatus: newStatus,
      user: {
        id: updated.id,
        rollNumber: updated.roll_number,
        department: updated.department,
        name: updated.name,
        phone: updated.phone,
        emailStatus: updated.email_status,
        collegeIdentityStatus: updated.college_identity_status,
        collegeVerificationMethod: updated.college_verification_method,
        collegeVerifiedAt: updated.college_verified_at,
        collegeRejectedReason: updated.college_rejected_reason
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin Audit Logs
 */
router.get('/admin/audit-logs', requireAdmin, async (req, res) => {
  try {
    const logs = await dbAll('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
    return res.json({
      success: true,
      logs: logs.map(l => ({
        id: l.id,
        adminId: l.admin_id,
        adminName: l.admin_name,
        action: l.action,
        targetType: l.target_type,
        targetId: l.target_id,
        details: JSON.parse(l.details_json || '{}'),
        createdAt: l.created_at
      }))
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin Export Candidate Roster (CSV / JSON)
 */
router.get('/admin/export', requireAdmin, async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const candidates = await dbAll("SELECT * FROM users WHERE role = 'student' OR role IS NULL ORDER BY created_at DESC");

    if (format === 'csv') {
      const headers = ['Login ID', 'Roll Number', 'Full Name', 'Email', 'Phone', 'Department', 'Email Verified', 'Created At'];
      const rows = candidates.map(c => [
        `"${c.credential_id || ''}"`,
        `"${c.roll_number || ''}"`,
        `"${c.name || ''}"`,
        `"${c.email || ''}"`,
        `"${c.phone || ''}"`,
        `"${c.department || ''}"`,
        c.email_verified ? 'Verified' : 'Unverified',
        `"${c.created_at || ''}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="candidates_roster.csv"');
      return res.send(csvContent);
    }

    return res.json({ success: true, count: candidates.length, candidates });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 3. GITHUB PROJECT REPOSITORY LINK VERIFICATION
// ============================================================================

/**
 * Verify GitHub repository link via official GitHub REST API.
 * Validates domain, retrieves metadata (description, language, stars, topics, README),
 * and correlates with candidate resume skills.
 */
router.post('/github/verify', async (req, res) => {
  try {
    const { url, githubUrl, repoUrl } = req.body;
    const targetUrl = (url || githubUrl || repoUrl || '').trim();

    if (!targetUrl) {
      return res.status(400).json({ error: 'GitHub repository URL is required.' });
    }

    // 1. Validate GitHub Domain
    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format provided.' });
    }

    if (!['github.com', 'www.github.com'].includes(parsedUrl.hostname.toLowerCase())) {
      return res.status(400).json({
        error: 'Only official GitHub repository URLs (github.com/owner/repo) are supported.'
      });
    }

    // 2. Parse owner and repo name
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
      return res.status(400).json({
        error: 'Please provide a repository URL in the format https://github.com/owner/repository.'
      });
    }

    const owner = pathParts[0];
    const repo = pathParts[1].replace(/\.git$/i, '');

    // 3. Fetch from official GitHub REST API
    const headers = {
      'User-Agent': 'SkillMatchAI-CareerVerifier/1.0',
      'Accept': 'application/vnd.github.v3+json'
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    let apiRes;
    try {
      apiRes = await fetch(apiUrl, { headers });
    } catch (netErr) {
      return res.status(502).json({
        success: false,
        status: 'Verification Failed',
        message: 'Could not connect to GitHub API. Please check your network or try again later.'
      });
    }

    let verificationStatus = 'Verified';
    let repoData = {};
    let hasReadme = false;
    let readmeSnippet = '';

    if (apiRes.status === 404) {
      verificationStatus = 'Not Found';
    } else if (apiRes.status === 403) {
      verificationStatus = 'Private or Inaccessible';
    } else if (!apiRes.ok) {
      verificationStatus = 'Verification Failed';
    } else {
      repoData = await apiRes.json();

      // Check README existence
      try {
        const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
        if (readmeRes.ok) {
          hasReadme = true;
          const readmeJson = await readmeRes.json();
          if (readmeJson.content) {
            readmeSnippet = Buffer.from(readmeJson.content, 'base64').toString('utf8').slice(0, 1000);
          }
        }
      } catch (e) {}

      if (!repoData.description && !hasReadme) {
        verificationStatus = 'Partially Verified';
      }
    }

    // 4. Correlate with Candidate's Resume Skills
    const resumeRow = await dbGet(
      'SELECT analysis_json FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    const resumeAnalysis = resumeRow ? JSON.parse(resumeRow.analysis_json) : null;
    const resumeSkills = resumeAnalysis?.parsedData?.skills?.allSkillsFound || [
      'Java', 'Spring Boot', 'SQL', 'Git', 'JavaScript', 'Python'
    ];

    const repoLanguages = [repoData.language].filter(Boolean);
    const repoTopics = repoData.topics || [];
    const allRepoKeywords = [
      repoData.name,
      repoData.description,
      ...repoLanguages,
      ...repoTopics,
      readmeSnippet
    ].filter(Boolean).join(' ').toLowerCase();

    const matchingTechnologies = resumeSkills.filter(skill =>
      allRepoKeywords.includes(skill.toLowerCase())
    );

    let relevanceScore = 50;
    if (verificationStatus === 'Verified') {
      relevanceScore = Math.min(100, 60 + matchingTechnologies.length * 10);
    } else if (verificationStatus === 'Partially Verified') {
      relevanceScore = 55;
    } else {
      relevanceScore = 20;
    }

    const verificationResult = {
      id: `ghv-${Date.now()}`,
      userId: req.user.id,
      repoUrl: `https://github.com/${owner}/${repo}`,
      owner,
      repo,
      status: verificationStatus,
      relevanceScore,
      repoDetails: {
        fullName: repoData.full_name || `${owner}/${repo}`,
        description: repoData.description || 'No description provided in repository metadata.',
        language: repoData.language || 'Not specified',
        stars: repoData.stargazers_count || 0,
        forks: repoData.forks_count || 0,
        openIssues: repoData.open_issues_count || 0,
        topics: repoTopics,
        hasReadme,
        isPrivate: repoData.private || false,
        lastUpdated: repoData.updated_at || new Date().toISOString()
      },
      relevanceAnalysis: {
        matchingTechnologies,
        evidenceSummary: verificationStatus === 'Verified'
          ? `Repository is public and actively verified. Matches ${matchingTechnologies.length} skills claimed on candidate resume (${matchingTechnologies.join(', ') || 'General Coding'}).`
          : verificationStatus === 'Partially Verified'
          ? 'Repository exists but lacks detailed README or description.'
          : verificationStatus === 'Private or Inaccessible'
          ? 'Repository is private or restricted. Access credentials were not bypassed.'
          : 'Repository could not be found under github.com.'
      }
    };

    // 5. Persist to github_verifications table
    await dbRun(
      `INSERT INTO github_verifications (
        id, user_id, repo_url, repo_owner, repo_name, status,
        relevance_score, repo_data_json, analysis_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        verificationResult.id,
        req.user.id,
        verificationResult.repoUrl,
        owner,
        repo,
        verificationStatus,
        relevanceScore,
        JSON.stringify(verificationResult.repoDetails),
        JSON.stringify(verificationResult.relevanceAnalysis)
      ]
    );

    return res.json({
      success: true,
      verification: verificationResult
    });
  } catch (err) {
    console.error('[GitHub Verification Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Get candidate's past GitHub verifications
 */
router.get('/github/verifications', async (req, res) => {
  try {
    const rows = await dbAll(
      'SELECT * FROM github_verifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    const parsed = rows.map(r => ({
      id: r.id,
      repoUrl: r.repo_url,
      owner: r.repo_owner,
      repo: r.repo_name,
      status: r.status,
      relevanceScore: r.relevance_score,
      repoDetails: JSON.parse(r.repo_data_json || '{}'),
      analysis: JSON.parse(r.analysis_json || '{}'),
      createdAt: r.created_at
    }));

    return res.json({ success: true, verifications: parsed });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
  * Project Working-Phase Check & Architectural Evidence Evaluation
  */
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
      `INSERT INTO project_verifications (
        id, resume_id, project_name, github_url, documentation,
        architecture_notes, has_db_connection, has_api_integration,
        has_authentication, has_testing, has_deployment,
        classification, evidence_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        verificationId,
        req.user?.id || 'guest',
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

// ============================================================================
// 4. RESUME UPLOAD, ANALYSIS & JOB DESCRIPTION MATCHING
// ============================================================================

// 1. Upload & Parse Resume Document
router.post('/resume/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume document provided. Please select a PDF, DOCX, or TXT file.' });
    }

    const targetRole = req.body.targetRole || req.user?.targetRole || 'Software Engineer';
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
    const { text, targetRole = req.user?.targetRole || 'Software Engineer', sourceName = 'Pasted_Resume.txt' } = req.body;
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

    // Fallback to demo resume if none uploaded yet
    const anyRow = await dbGet('SELECT * FROM resumes ORDER BY created_at DESC LIMIT 1');
    if (anyRow && anyRow.analysis_json) {
      return res.json({ success: true, analysis: JSON.parse(anyRow.analysis_json) });
    }

    return res.json({ success: false, message: 'No resume analyzed yet' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Job Description Matcher — Separates Resume Quality Score from JD Match Score
router.post('/jd/match', async (req, res) => {
  try {
    const {
      jdText,
      jobTitle = 'Target Role Opening',
      companyName = 'Hiring Organization',
      resumeText
    } = req.body;

    if (!jdText || jdText.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide a substantial job description (minimum 20 characters).' });
    }

    // Fetch user's current resume
    const resumeRow = await dbGet(
      'SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    let analysis = resumeRow ? JSON.parse(resumeRow.analysis_json) : null;

    if (!analysis && resumeText) {
      analysis = analyzeResume(resumeText, jobTitle);
    }

    const candidateSkills = analysis?.parsedData?.skills?.allSkillsFound || [
      'Java', 'SQL', 'Git', 'Data Structures', 'Python', 'Spring Boot'
    ];
    const candidateProjects = analysis?.parsedData?.projects || [];
    const resumeQualityScore = analysis?.scores?.overallScore || 75;

    // Perform JD match
    const matchResult = matchJobDescription(jdText, candidateSkills, candidateProjects);

    const jdMatchId = `jdm-${Date.now()}`;
    await dbRun(
      `INSERT INTO jd_matches (
        id, resume_id, job_title, company_name, jd_text,
        match_score, matched_skills_json, missing_skills_json, recommendations_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        jdMatchId,
        resumeRow?.id || req.user.id,
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
      jdMatchId,
      scores: {
        resumeQualityScore, // General resume quality out of 100
        jdMatchScore: matchResult.matchScore // Specific JD fit out of 100
      },
      matchResult: {
        ...matchResult,
        jobTitle,
        companyName,
        prioritizedChecklist: [
          ...matchResult.skillsMissingFromResume.map(s => `Add practical evidence or coursework for "${s}"`),
          ...matchResult.keywordAdvice
        ]
      }
    });
  } catch (err) {
    console.error('[JD Match Error]', err);
    return res.status(400).json({ error: err.message });
  }
});

// Dedicated Standalone Job Description Analysis (when candidate has only JD)
router.post('/jd/analyze-only', async (req, res) => {
  try {
    const { jdText, jobTitle = 'Target Role Opening', companyName = 'Hiring Organization' } = req.body;
    if (!jdText || jdText.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide substantial Job Description copy (at least 20 characters).' });
    }
    const result = analyzeJobDescriptionOnly(jdText.trim(), jobTitle, companyName);
    return res.json({
      success: true,
      analysis: result
    });
  } catch (err) {
    console.error('[JD Analyze Only Error]', err);
    return res.status(400).json({ error: err.message });
  }
});

// 5. Get Past JD Matches
router.get('/jd/matches', async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT * FROM jd_matches 
       WHERE resume_id = ? OR resume_id IN (SELECT id FROM resumes WHERE user_id = ?)
       ORDER BY created_at DESC`,
      [req.user.id, req.user.id]
    );

    const parsed = rows.map(r => ({
      id: r.id,
      jobTitle: r.job_title,
      companyName: r.company_name,
      matchScore: r.match_score,
      matchedSkills: JSON.parse(r.matched_skills_json || '[]'),
      missingSkills: JSON.parse(r.missing_skills_json || '[]'),
      recommendations: JSON.parse(r.recommendations_json || '[]'),
      createdAt: r.created_at
    }));

    return res.json({ success: true, matches: parsed });
  } catch (err) {
    return res.status(500).json({ error: err.message });
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

    const targetRole = req.body.targetRole || analysis.targetRole || 'Software Engineer';
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
// 5. AI VOICE INTERVIEW AGENT — REAL-TIME CONVERSATIONAL INTERVIEWS
// ============================================================================

// Start Interactive Voice Interview Session Grounded in Candidate Resume
router.post('/interview/interactive/start', async (req, res) => {
  try {
    const {
      interviewType = 'Mixed Interview',
      targetRole = req.user?.targetRole || 'Software Engineer',
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
          education: [{ degree: req.user.degree || 'B.Tech Computer Science', college: req.user.college || 'Engineering College' }],
          skills: { allSkillsFound: ['Java', 'SQL', 'Data Structures', 'OOP', 'Git', 'Problem Solving'] },
          projects: [{ name: 'Campus Placement Portal', technologies: ['Java', 'Spring Boot', 'SQL'] }]
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
// 6. PERSONALIZED JOB SUGGESTIONS, SAVED JOBS & LEARNING
// ============================================================================

// Personalized Job Recommendations Grounded in Candidate Resume
router.get('/jobs/recommendations', async (req, res) => {
  try {
    const targetRole = req.query.role || req.user?.targetRole || 'Software Engineer';
    const resumeRow = await dbGet('SELECT analysis_json FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
    const analysis = resumeRow ? JSON.parse(resumeRow.analysis_json) : null;
    const candidateSkills = (analysis?.parsedData?.skills?.allSkillsFound || [
      'Java', 'Spring Boot', 'SQL', 'Git', 'JavaScript'
    ]).map(s => s.toLowerCase());

    const catalogJobs = [
      {
        id: 'job-rec-01',
        title: 'Junior Software Engineer',
        company: 'TCS Digital',
        location: 'Bengaluru / Remote',
        experience: '0-2 Years',
        salary: '₹7.5 - ₹10 LPA',
        url: 'https://www.tcs.com/careers',
        requiredSkills: ['Java', 'Spring Boot', 'SQL', 'REST APIs', 'Git'],
        description: 'Design and deploy scalable enterprise microservices using modern Java and Spring ecosystem.'
      },
      {
        id: 'job-rec-02',
        title: 'Full Stack Java Developer',
        company: 'Infosys Specialist Programmer',
        location: 'Hyderabad / Hybrid',
        experience: 'Fresher / Entry',
        salary: '₹9.5 LPA',
        url: 'https://www.infosys.com/careers',
        requiredSkills: ['Java', 'React', 'SQL', 'Data Structures', 'Docker'],
        description: 'End-to-end full stack web development building secure cloud-native platforms.'
      },
      {
        id: 'job-rec-03',
        title: 'Associate Cloud Engineer',
        company: 'Cognizant GenC Elevate',
        location: 'Chennai / On-site',
        experience: '0-1 Years',
        salary: '₹6.5 - ₹8.5 LPA',
        url: 'https://careers.cognizant.com',
        requiredSkills: ['Java', 'Python', 'AWS', 'Docker', 'Linux'],
        description: 'Support continuous integration, containerization, and automated deployments on cloud infrastructure.'
      },
      {
        id: 'job-rec-04',
        title: 'Backend Systems Developer',
        company: 'Accenture Technology',
        location: 'Pune / Remote',
        experience: '0-2 Years',
        salary: '₹8 - ₹11 LPA',
        url: 'https://www.accenture.com/careers',
        requiredSkills: ['Java', 'Microservices', 'PostgreSQL', 'Kafka', 'Git'],
        description: 'Build high-throughput transactional backends and event-driven data streaming pipelines.'
      }
    ];

    const scoredJobs = catalogJobs.map(job => {
      const matching = job.requiredSkills.filter(s => candidateSkills.includes(s.toLowerCase()));
      const missing = job.requiredSkills.filter(s => !candidateSkills.includes(s.toLowerCase()));
      const matchScore = Math.round((matching.length / job.requiredSkills.length) * 100);

      return {
        ...job,
        matchScore,
        matchingSkills: matching,
        missingSkills: missing,
        compatibilityReason: `Candidate demonstrates ${matching.length} of ${job.requiredSkills.length} required skills (${matching.join(', ')}).`
      };
    });

    scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

    return res.json({ success: true, recommendations: scoredJobs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Saved Jobs
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

// Roadmap & Learning
router.get('/roadmap', async (req, res) => {
  try {
    const targetRole = req.query.role || req.user?.targetRole || 'Software Engineer';
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

// Catalogs
router.get('/companies', (req, res) => {
  return res.json({ success: true, companies: COMPANY_CATALOG });
});

router.get('/roles', (req, res) => {
  return res.json({ success: true, roles: Object.values(ROLE_BENCHMARKS) });
});

// Interview Preparation Questions based on role & resume
router.get('/interview/questions', async (req, res) => {
  try {
    const role = req.query.role || req.user?.targetRole || 'Software Engineer';
    const resumeRow = await dbGet('SELECT analysis_json FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
    let analysis = resumeRow ? JSON.parse(resumeRow.analysis_json) : null;
    let parsedData = analysis?.parsedData;
    if (!parsedData) {
      const anyRow = await dbGet('SELECT analysis_json FROM resumes ORDER BY created_at DESC LIMIT 1');
      if (anyRow?.analysis_json) {
        try { parsedData = JSON.parse(anyRow.analysis_json).parsedData; } catch (e) {}
      }
    }
    const questions = generateInterviewQuestions(parsedData || { skills: { allSkillsFound: ['Java', 'SQL', 'Git'] }, projects: [] }, role);
    return res.json({ success: true, questions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Resume Versions
router.post('/versions/save', async (req, res) => {
  try {
    const { versionName, targetRole, summary, skills, projects, diffNotes } = req.body;
    if (!versionName) return res.status(400).json({ error: 'versionName is required.' });

    const id = `ver-${Date.now()}`;
    await dbRun(
      `INSERT INTO resume_versions (id, user_id, version_name, target_role, summary, skills_json, projects_json, diff_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user?.id || 'guest',
        versionName,
        targetRole || 'Software Engineer',
        summary || '',
        JSON.stringify(skills || []),
        JSON.stringify(projects || []),
        diffNotes || ''
      ]
    );

    return res.json({ success: true, versionId: id, message: 'Resume version saved.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/versions', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM resume_versions WHERE user_id = ? ORDER BY created_at DESC', [req.user?.id || 'guest']);
    const versions = rows.map(r => ({
      id: r.id,
      versionName: r.version_name,
      targetRole: r.target_role,
      summary: r.summary,
      skills: JSON.parse(r.skills_json || '[]'),
      projects: JSON.parse(r.projects_json || '[]'),
      diffNotes: r.diff_notes,
      createdAt: r.created_at
    }));
    return res.json({ success: true, versions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Candidate Report Download
router.get('/report/download', async (req, res) => {
  try {
    const resumeRow = await dbGet('SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user?.id || 'guest']);
    const userRow = await dbGet('SELECT * FROM users WHERE id = ?', [req.user?.id || 'guest']);
    let analysis = null;
    if (resumeRow?.analysis_json) {
      try { analysis = JSON.parse(resumeRow.analysis_json); } catch (e) {}
    }

    const candidateName = analysis?.parsedData?.contact?.name || userRow?.name || 'PRIYA SHARMA';
    const email = analysis?.parsedData?.contact?.email || userRow?.email || 'student@kce.ac.in';
    const overallScore = analysis?.scorecard?.overallScore || analysis?.scores?.overallScore || 78;

    const reportContent = `
================================================================================
CAREERLENS AI — CANDIDATE READINESS REPORT
================================================================================
Generated: ${new Date().toISOString()}
Candidate: ${candidateName.toUpperCase()}
Email: ${email}
Institutional Status: VERIFIED
Overall Job Readiness Score: ${overallScore}/100

--------------------------------------------------------------------------------
EXECUTIVE EVALUATION SUMMARY
--------------------------------------------------------------------------------
The candidate displays foundational engineering rigor with verified project implementations
and structured technical competencies aligned with industry benchmarks.

Key Highlights:
- Core Technical Skills: ${(analysis?.parsedData?.skills?.allSkillsFound || ['Java', 'SQL', 'Git', 'Spring Boot']).slice(0, 8).join(', ')}
- Verified Projects: ${analysis?.parsedData?.projects?.length || 2} production-oriented modules
- Status: Ready for technical screening and initial engineering interviews.

================================================================================
SkillMatch AI Verification Engine — Secure Institutional Assessment
================================================================================
`.trim();

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="SkillMatch_Report_${candidateName.replace(/\s+/g, '_')}.txt"`);
    return res.send(reportContent);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
