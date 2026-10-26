/**
 * SkillMatch AI — Resume Context Service
 * Retrieves and structures the authenticated candidate's verified resume context
 * for AI Question Generation and Interview Evaluation.
 */

import { dbGet, dbRun } from '../db/database.js';

/**
 * Retrieves the current candidate's selected resume and prepares the structured context for the AI interviewer.
 * 
 * @param {Object} params
 * @param {string} params.userId - Authenticated candidate's unique user ID
 * @param {string} [params.resumeId] - Optional specific resume ID
 * @param {Object} [params.resumeData] - Optional resume data object passed from client
 * @returns {Promise<Object>} Structured resume context
 */
export async function getResumeContextForCandidate({ userId, resumeId = null, resumeData = null }) {
  if (!userId || userId === 'guest-user') {
    throw new Error('Authentication required. Cannot retrieve resume context without a valid candidate ID.');
  }

  // 1. Query resume record strictly associated with the authenticated candidate
  let resumeRow = null;
  if (resumeId) {
    resumeRow = await dbGet(
      'SELECT * FROM resumes WHERE id = ? AND user_id = ?',
      [resumeId, userId]
    );
  } else {
    // Retrieve the most recent successfully processed resume for this candidate
    resumeRow = await dbGet(
      "SELECT * FROM resumes WHERE user_id = ? AND (processing_status = 'ready' OR processing_status IS NULL) ORDER BY COALESCE(updated_at, created_at) DESC, rowid DESC LIMIT 1",
      [userId]
    );
  }

  // If no resume record in DB, but client provided resumeData with parsed details, persist and use it
  if (!resumeRow && resumeData && (resumeData.parsedData || resumeData.skills || resumeData.detectedSkills)) {
    const rawText = resumeData.rawText || resumeData.extractedText || `
Name: ${resumeData.parsedData?.contact?.name || 'Candidate'}
Email: ${resumeData.parsedData?.contact?.email || 'email@college.edu'}
Degree: ${resumeData.parsedData?.education?.[0]?.degree || 'Computer Science & Engineering'}
College: ${resumeData.parsedData?.education?.[0]?.college || 'University'}
Target Role: ${resumeData.targetRole || 'Software Engineer'}
Skills: ${(resumeData.parsedData?.skills?.allSkillsFound || resumeData.detectedSkills || []).join(', ')}
${(resumeData.parsedData?.projects || []).map(p => `Project: "${p.name}"\nTechnologies: ${(p.technologies || []).join(', ')}\nSummary: ${p.description || ''}`).join('\n')}
    `.trim();

    const resumeIdToSave = resumeData.id || `res-${Date.now()}`;
    await dbRun(
      `INSERT OR REPLACE INTO resumes 
       (id, user_id, file_name, file_type, file_size, raw_text, parsed_json, target_role, analysis_json, processing_status, extracted_text_length, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready', ?, ?)`,
      [
        resumeIdToSave,
        userId,
        resumeData.fileName || 'Resume_Document.pdf',
        'PDF',
        rawText.length,
        rawText,
        JSON.stringify(resumeData.parsedData || {}),
        resumeData.targetRole || 'Software Engineer',
        JSON.stringify(resumeData),
        rawText.length,
        new Date().toISOString()
      ]
    );

    resumeRow = await dbGet('SELECT * FROM resumes WHERE id = ?', [resumeIdToSave]);
  }

  // If user is demo candidate and has no resume in DB, query seeded demo resume
  if (!resumeRow && (userId === 'user-demo' || userId.includes('demo'))) {
    resumeRow = await dbGet('SELECT * FROM resumes WHERE user_id = ? OR id = ? LIMIT 1', ['user-demo', 'res-demo-default']);
  }

  // 2. Validate resume existence
  if (!resumeRow) {
    console.warn(`[Diagnostic] [Resume Context] No processed resume record found for candidate user_id=${userId}`);
    throw new Error('No uploaded resume found for your account. Please upload your resume first before starting the AI Voice Interview.');
  }

  // 3. Validate processing status
  if (resumeRow.processing_status === 'failed') {
    console.warn(`[Diagnostic] [Resume Context] Resume ${resumeRow.id} for user ${userId} has status 'failed': ${resumeRow.error_message}`);
    throw new Error(`Your uploaded resume could not be processed: ${resumeRow.error_message || 'Unreadable format'}. Please upload a readable PDF, DOCX, or TXT file.`);
  }

  // 4. Validate extracted text length and readability
  const rawText = (resumeRow.raw_text || '').trim();
  if (rawText.length < 50) {
    console.warn(`[Diagnostic] [Resume Context] Resume ${resumeRow.id} contains insufficient text (${rawText.length} chars)`);
    throw new Error('Your uploaded resume contains insufficient readable text (minimum 50 characters required). Please ensure your document is not an image-only scan or corrupted file.');
  }

  // 5. Parse analysis JSON or reconstruct from parsed JSON
  let analysis = null;
  let parsedData = null;
  try {
    if (resumeRow.analysis_json) {
      analysis = JSON.parse(resumeRow.analysis_json);
      parsedData = analysis.parsedData;
    }
  } catch (err) {
    console.warn(`[Diagnostic] [Resume Context] Error parsing analysis_json for resume ${resumeRow.id}:`, err.message);
  }

  if (!parsedData && resumeRow.parsed_json) {
    try {
      parsedData = JSON.parse(resumeRow.parsed_json);
    } catch (err) {
      console.warn(`[Diagnostic] [Resume Context] Error parsing parsed_json for resume ${resumeRow.id}:`, err.message);
    }
  }

  // Baseline extraction fallback if parsedData is incomplete
  const contact = parsedData?.contact || {
    name: 'Candidate',
    email: 'Not provided in resume'
  };

  const education = parsedData?.education || [];
  const skills = parsedData?.skills || {
    programmingLanguages: [],
    webTechnologies: [],
    frameworks: [],
    databases: [],
    cloudAndDevOps: [],
    toolsAndPlatforms: [],
    enterpriseAndSpecialized: [],
    allSkillsFound: []
  };

  const allSkillsFound = Array.isArray(skills.allSkillsFound)
    ? skills.allSkillsFound
    : (Array.isArray(skills) ? skills : []);

  const projects = Array.isArray(parsedData?.projects) ? parsedData.projects : [];
  const experience = Array.isArray(parsedData?.experience) ? parsedData.experience : [];
  const certifications = Array.isArray(parsedData?.certifications) ? parsedData.certifications : [];

  // 6. Check that extracted content has at least some skills or projects to ground an interview
  if (allSkillsFound.length === 0 && projects.length === 0 && rawText.length < 100) {
    console.warn(`[Diagnostic] [Resume Context] Resume ${resumeRow.id} has 0 skills and 0 projects.`);
    throw new Error('Uploaded resume does not contain identifiable technical skills or projects to conduct an interview. Please upload a comprehensive resume.');
  }

  const userRecord = await dbGet('SELECT name FROM users WHERE id = ?', [userId]);
  const rawContactName = (contact.name || '').replace(/^(name\s*:\s*)/i, '').trim();
  const candidateName = rawContactName && rawContactName !== 'Not found in resume' && rawContactName !== 'Candidate'
    ? rawContactName
    : (userRecord?.name || 'Candidate');

  const structuredContext = {
    resumeId: resumeRow.id,
    userId: resumeRow.user_id,
    fileName: resumeRow.file_name || 'Candidate_Resume.pdf',
    targetRole: resumeRow.target_role || analysis?.targetRole || 'Software Engineer',
    candidateName,
    education: Array.isArray(education) ? education : [education],
    skills: {
      ...skills,
      allSkillsFound
    },
    projects: projects.map((p, idx) => ({
      id: `proj-${idx + 1}`,
      name: p.name || `Project ${idx + 1}`,
      technologies: Array.isArray(p.technologies) ? p.technologies : [],
      problemSolved: p.problemSolved || '',
      architecture: p.architecture || {},
      complexity: p.complexity || 'Moderate',
      rawContent: p.rawContent || p.description || '',
      evidenceNotes: p.evidenceNotes || []
    })),
    experience: experience.map(exp => ({
      title: exp.title || exp.role || '',
      company: exp.company || '',
      duration: exp.duration || '',
      responsibilities: exp.responsibilities || []
    })),
    certifications,
    rawText: rawText.slice(0, 4000) // Keep reasonable window for prompt context
  };

  console.log(`[Diagnostic] [Resume Context Prepared] userId=${userId} resumeId=${resumeRow.id} skillsCount=${allSkillsFound.length} projectsCount=${structuredContext.projects.length}`);

  return structuredContext;
}
