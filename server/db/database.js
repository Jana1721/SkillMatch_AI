import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = process.env.VERCEL
  ? path.join('/tmp', 'data')
  : path.join(__dirname, '../../data');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'careerlens.sqlite');
const db = new sqlite3.Database(DB_PATH);

// Helper for promise-based queries
export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Generate permanent unique credential ID (e.g. SKM-2026-A4F9D2)
export function generateCredentialId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SKM-2026-${code}`;
}

// Initialize tables
export async function initDatabase() {
  // 1. Users Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      credential_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      college TEXT DEFAULT '',
      degree TEXT DEFAULT '',
      target_role TEXT DEFAULT 'Java Developer',
      email_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      reset_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Transactional Emails Outbox
  await dbRun(`
    CREATE TABLE IF NOT EXISTS user_emails (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body_html TEXT NOT NULL,
      email_type TEXT,
      status TEXT DEFAULT 'sent',
      preview_url TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Resumes Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      file_name TEXT,
      file_type TEXT,
      file_size INTEGER,
      raw_text TEXT,
      parsed_json TEXT,
      target_role TEXT,
      analysis_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 4. Project Verifications
  await dbRun(`
    CREATE TABLE IF NOT EXISTS project_verifications (
      id TEXT PRIMARY KEY,
      resume_id TEXT,
      project_name TEXT,
      github_url TEXT,
      documentation TEXT,
      architecture_notes TEXT,
      has_db_connection INTEGER,
      has_api_integration INTEGER,
      has_authentication INTEGER,
      has_testing INTEGER,
      has_deployment INTEGER,
      classification TEXT,
      evidence_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 5. Job Description Matches
  await dbRun(`
    CREATE TABLE IF NOT EXISTS jd_matches (
      id TEXT PRIMARY KEY,
      resume_id TEXT,
      job_title TEXT,
      company_name TEXT,
      jd_text TEXT,
      match_score INTEGER,
      matched_skills_json TEXT,
      missing_skills_json TEXT,
      recommendations_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 6. Interactive Voice Interview Sessions
  await dbRun(`
    CREATE TABLE IF NOT EXISTS interview_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      resume_id TEXT,
      target_role TEXT,
      interview_type TEXT,
      experience_level TEXT,
      difficulty TEXT,
      total_questions INTEGER,
      current_question_index INTEGER,
      session_data_json TEXT,
      transcript_json TEXT,
      status TEXT DEFAULT 'in_progress',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `);

  try {
    await dbRun(`ALTER TABLE interview_sessions ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
  } catch (e) {
    // Column already exists
  }

  // 7. Interview Evaluations & Performance Reports
  await dbRun(`
    CREATE TABLE IF NOT EXISTS interview_evaluations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      target_role TEXT,
      overall_score INTEGER,
      communication_score INTEGER,
      technical_score INTEGER,
      problem_solving_score INTEGER,
      evaluation_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 8. User Saved Jobs
  await dbRun(`
    CREATE TABLE IF NOT EXISTS user_saved_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      job_data_json TEXT,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, job_id)
    )
  `);

  // 9. User Learning Progress
  await dbRun(`
    CREATE TABLE IF NOT EXISTS user_learning_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_type TEXT,
      status TEXT DEFAULT 'completed',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, item_id)
    )
  `);

  // Seed default demo user if not present
  const existingDemo = await dbGet(`SELECT * FROM users WHERE email = ?`, ['demo@skillmatch.ai']);
  if (!existingDemo) {
    const salt = await bcrypt.genSalt(10);
    const demoHash = await bcrypt.hash('password123', salt);
    await dbRun(
      `INSERT INTO users (id, credential_id, name, email, password_hash, college, degree, target_role, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'user-demo',
        'SKM-2026-DEMO01',
        'Demo Candidate',
        'demo@skillmatch.ai',
        demoHash,
        'National Institute of Technology',
        'B.Tech Computer Science & Engineering',
        'Java Developer',
        1
      ]
    );
    console.log('[SkillMatch DB] Seeded demo user: demo@skillmatch.ai / password123 [ID: SKM-2026-DEMO01]');
  }

  console.log('[SkillMatch DB] SQLite initialized successfully at', DB_PATH);
}

export default db;
