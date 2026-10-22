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
const JSON_DB_PATH = path.join(DB_DIR, 'careerlens.json');

let sqliteDb = null;
let useJsEngine = false;

// Initialize pure-JS store with all tables
let store = {
  users: [],
  user_emails: [],
  resumes: [],
  project_verifications: [],
  github_verifications: [],
  jd_matches: [],
  interview_sessions: [],
  interview_evaluations: [],
  user_saved_jobs: [],
  user_learning_progress: [],
  audit_logs: []
};

// Load existing JSON if available
function loadJsonStore() {
  try {
    if (fs.existsSync(JSON_DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf-8'));
      store = { ...store, ...data };
    }
  } catch (err) {
    console.warn('[DB Engine] Could not read JSON store:', err.message);
  }
}

// Persist JSON store to disk
function saveJsonStore() {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    // Non-fatal in read-only environments
  }
}

loadJsonStore();

// Try loading native sqlite3; if it fails (e.g. GLIBC incompatibility on Vercel), fall back to JS engine
try {
  const sqlite3Module = await import('sqlite3');
  const sqlite3 = sqlite3Module.default || sqlite3Module;
  sqliteDb = new sqlite3.Database(DB_PATH);
} catch (err) {
  console.warn('[DB Engine] Native sqlite3 unavailable (' + err.message + '). Using resilient Pure-JS Database Engine.');
  useJsEngine = true;
}

// ----------------------------------------------------------------------------
// PURE JAVASCRIPT QUERY PARSER & EXECUTOR
// ----------------------------------------------------------------------------

function executeJsRun(sql, params = []) {
  const trimmed = sql.trim();

  // 1. CREATE TABLE / ALTER TABLE
  if (/^CREATE\s+TABLE/i.test(trimmed)) {
    const match = trimmed.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i);
    if (match) {
      const table = match[1];
      if (!store[table]) store[table] = [];
    }
    return { lastID: 0, changes: 0 };
  }

  if (/^ALTER\s+TABLE/i.test(trimmed)) {
    return { lastID: 0, changes: 0 };
  }

  // 2. INSERT INTO
  if (/^INSERT\s+INTO/i.test(trimmed)) {
    const match = trimmed.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i);
    if (match) {
      const table = match[1];
      const cols = match[2].split(',').map(c => c.trim());
      if (!store[table]) store[table] = [];

      const record = {};
      cols.forEach((col, idx) => {
        record[col] = params[idx] !== undefined ? params[idx] : null;
      });

      if (!record.created_at) record.created_at = new Date().toISOString();
      if (!record.updated_at) record.updated_at = new Date().toISOString();

      // Upsert handling for unique keys
      if (table === 'user_saved_jobs') {
        store[table] = store[table].filter(r => !(r.user_id === record.user_id && r.job_id === record.job_id));
      } else if (table === 'user_learning_progress') {
        store[table] = store[table].filter(r => !(r.user_id === record.user_id && r.item_id === record.item_id));
      } else if (record.id) {
        store[table] = store[table].filter(r => r.id !== record.id);
      }

      store[table].push(record);
      saveJsonStore();
      return { lastID: 1, changes: 1 };
    }
  }

  // 3. UPDATE
  if (/^UPDATE\s+/i.test(trimmed)) {
    const match = trimmed.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/is);
    if (match) {
      const table = match[1];
      const setClause = match[2];
      const whereClause = match[3];

      if (!store[table]) return { lastID: 0, changes: 0 };

      const setAssignments = setClause.split(',').map(s => s.trim());
      const paramCountForSet = setAssignments.length;
      const setParams = params.slice(0, paramCountForSet);
      const whereParams = params.slice(paramCountForSet);

      let changes = 0;
      store[table].forEach(row => {
        if (matchesWhere(row, whereClause, whereParams)) {
          setAssignments.forEach((assign, idx) => {
            const colMatch = assign.match(/^([a-zA-Z0-9_]+)\s*=\s*/);
            if (colMatch) {
              const col = colMatch[1];
              if (assign.toLowerCase().includes('current_timestamp')) {
                row[col] = new Date().toISOString();
              } else {
                row[col] = setParams[idx];
              }
            }
          });
          row.updated_at = new Date().toISOString();
          changes++;
        }
      });

      saveJsonStore();
      return { lastID: 0, changes };
    }
  }

  // 4. DELETE
  if (/^DELETE\s+FROM/i.test(trimmed)) {
    const match = trimmed.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)\s+WHERE\s+(.+)/is);
    if (match) {
      const table = match[1];
      const whereClause = match[2];
      if (!store[table]) return { lastID: 0, changes: 0 };

      const initialLength = store[table].length;
      store[table] = store[table].filter(row => !matchesWhere(row, whereClause, params));
      const changes = initialLength - store[table].length;
      saveJsonStore();
      return { lastID: 0, changes };
    }
  }

  return { lastID: 0, changes: 0 };
}

function executeJsSelect(sql, params = []) {
  const trimmed = sql.trim();

  // Aggregate: COUNT(*)
  if (/SELECT\s+COUNT\(\*\)\s+(?:as\s+\w+\s+)?FROM\s+([a-zA-Z0-9_]+)/i.test(trimmed)) {
    const match = trimmed.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    const table = match ? match[1] : '';
    let rows = store[table] ? [...store[table]] : [];
    const whereMatch = trimmed.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/is);
    if (whereMatch) {
      rows = rows.filter(r => matchesWhere(r, whereMatch[1], params));
    }
    return [{ count: rows.length, 'COUNT(*)': rows.length }];
  }

  // Aggregate: AVG(score)
  if (/SELECT\s+AVG\((?:overall_score|ats_score)\)\s+(?:as\s+\w+\s+)?FROM\s+([a-zA-Z0-9_]+)/i.test(trimmed)) {
    const match = trimmed.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    const table = match ? match[1] : '';
    let rows = store[table] ? [...store[table]] : [];
    const whereMatch = trimmed.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/is);
    if (whereMatch) {
      rows = rows.filter(r => matchesWhere(r, whereMatch[1], params));
    }
    const scores = rows.map(r => r.overall_score || r.ats_score || 0).filter(s => s > 0);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return [{ avg, 'AVG(overall_score)': avg }];
  }

  // Handle JOIN in interview evaluations
  if (/FROM\s+interview_evaluations\s+e\s+LEFT\s+JOIN\s+interview_sessions\s+s/i.test(trimmed)) {
    const userId = params[0];
    const evals = (store.interview_evaluations || []).filter(e => !userId || e.user_id === userId);
    return evals.map(e => {
      const session = (store.interview_sessions || []).find(s => s.id === e.session_id) || {};
      return {
        ...e,
        total_questions: session.total_questions,
        interview_type: session.interview_type,
        difficulty: session.difficulty
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50);
  }

  const tableMatch = trimmed.match(/FROM\s+([a-zA-Z0-9_]+)/i);
  if (!tableMatch) return [];
  const table = tableMatch[1];
  let rows = store[table] ? [...store[table]] : [];

  // Filter with WHERE clause
  const whereMatch = trimmed.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/is);
  if (whereMatch) {
    const whereClause = whereMatch[1];
    rows = rows.filter(r => matchesWhere(r, whereClause, params));
  }

  // Sort with ORDER BY
  if (/ORDER\s+BY\s+(?:created_at|saved_at|sent_at)\s+DESC/i.test(trimmed)) {
    rows.sort((a, b) => {
      const timeA = new Date(a.created_at || a.saved_at || a.sent_at || 0).getTime();
      const timeB = new Date(b.created_at || b.saved_at || b.sent_at || 0).getTime();
      return timeB - timeA;
    });
  }

  // Limit
  const limitMatch = trimmed.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) {
    rows = rows.slice(0, parseInt(limitMatch[1], 10));
  }

  return rows;
}

function matchesWhere(row, whereClause, params) {
  const normalized = whereClause.replace(/\s+/g, ' ').trim();

  // LOWER(email) = ? OR LOWER(credential_id) = ? OR LOWER(roll_number) = ?
  if (/LOWER\(email\)\s*=\s*\?\s*OR\s*LOWER\(credential_id\)\s*=\s*\?(?:\s*OR\s*LOWER\(roll_number\)\s*=\s*\?)?/i.test(normalized)) {
    const v0 = (params[0] || '').toLowerCase();
    const v1 = (params[1] || v0).toLowerCase();
    const v2 = (params[2] || v0).toLowerCase();
    const rowEmail = (row.email || '').toLowerCase();
    const rowCred = (row.credential_id || '').toLowerCase();
    const rowRoll = (row.roll_number || '').toLowerCase();
    return rowEmail === v0 || rowCred === v1 || rowRoll === v2;
  }

  // LOWER(roll_number) = ?
  if (/LOWER\(roll_number\)\s*=\s*\?/i.test(normalized)) {
    return (row.roll_number || '').toLowerCase() === (params[0] || '').toLowerCase();
  }

  // roll_number = ?
  if (/\broll_number\s*=\s*\?/i.test(normalized)) {
    return (row.roll_number || '').toLowerCase() === (params[0] || '').toLowerCase();
  }

  // LOWER(credential_id) = ?
  if (/LOWER\(credential_id\)\s*=\s*\?/i.test(normalized)) {
    return (row.credential_id || '').toLowerCase() === (params[0] || '').toLowerCase();
  }

  // credential_id = ?
  if (/\bcredential_id\s*=\s*\?/i.test(normalized)) {
    return (row.credential_id || '').toLowerCase() === (params[0] || '').toLowerCase();
  }

  // role = ?
  if (/\brole\s*=\s*\?/i.test(normalized)) {
    return (row.role || 'student') === params[0];
  }

  // LOWER(email) = ?
  if (/LOWER\(email\)\s*=\s*\?/i.test(normalized)) {
    return (row.email || '').toLowerCase() === (params[0] || '').toLowerCase();
  }

  // email = ?
  if (/\bemail\s*=\s*\?/i.test(normalized)) {
    return (row.email || '').toLowerCase() === (params[0] || '').toLowerCase();
  }

  // id = ?
  if (/^id\s*=\s*\?/i.test(normalized) || /\bid\s*=\s*\?/i.test(normalized)) {
    return row.id === params[params.length - 1] || row.id === params[0];
  }

  // user_id = ? AND job_id = ?
  if (/user_id\s*=\s*\?\s*AND\s*job_id\s*=\s*\?/i.test(normalized)) {
    return row.user_id === params[0] && row.job_id === params[1];
  }

  // user_id = ? OR recipient_email = ?
  if (/user_id\s*=\s*\?\s*OR\s*recipient_email\s*=\s*\?/i.test(normalized)) {
    return row.user_id === params[0] || row.recipient_email === params[1];
  }

  // user_id = ?
  if (/\buser_id\s*=\s*\?/i.test(normalized)) {
    return row.user_id === params[0];
  }

  // session_id = ?
  if (/\bsession_id\s*=\s*\?/i.test(normalized)) {
    return row.session_id === params[0];
  }

  return true;
}

// ----------------------------------------------------------------------------
// EXPORTED PROMISE WRAPPERS
// ----------------------------------------------------------------------------

export function dbRun(sql, params = []) {
  if (useJsEngine || !sqliteDb) {
    return Promise.resolve(executeJsRun(sql, params));
  }

  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function dbGet(sql, params = []) {
  if (useJsEngine || !sqliteDb) {
    const rows = executeJsSelect(sql, params);
    return Promise.resolve(rows.length > 0 ? rows[0] : null);
  }

  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbAll(sql, params = []) {
  if (useJsEngine || !sqliteDb) {
    return Promise.resolve(executeJsSelect(sql, params));
  }

  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Generate permanent unique candidate credential ID formatted as KCE-<year>-<rollNumber>
export function generateCredentialId(year = '2026', rollNumber = '') {
  const cleanYear = String(year).trim().replace(/[^a-zA-Z0-9]/g, '') || '2026';
  if (rollNumber && String(rollNumber).trim()) {
    const cleanRoll = String(rollNumber).trim().toUpperCase().replace(/\s+/g, '');
    return `KCE-${cleanYear}-${cleanRoll}`;
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `KCE-${cleanYear}-${code}`;
}

// Initialize tables & seed data
export async function initDatabase() {
  // 1. Users Table with Roll Number, Phone, Department, Role, OTP metadata
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      credential_id TEXT UNIQUE NOT NULL,
      roll_number TEXT UNIQUE,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      department TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      college TEXT DEFAULT '',
      degree TEXT DEFAULT '',
      target_role TEXT DEFAULT 'Java Developer',
      email_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      token_expires_at DATETIME,
      verification_attempts INTEGER DEFAULT 0,
      last_resend_at DATETIME,
      reset_token TEXT,
      reset_expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Safe migrations for existing SQLite tables
  const userColumnsToAdd = [
    'roll_number TEXT',
    'phone TEXT',
    'department TEXT',
    'role TEXT DEFAULT "student"',
    'token_expires_at DATETIME',
    'verification_attempts INTEGER DEFAULT 0',
    'last_resend_at DATETIME',
    'reset_token TEXT',
    'reset_expires_at DATETIME'
  ];

  for (const colDef of userColumnsToAdd) {
    try {
      await dbRun(`ALTER TABLE users ADD COLUMN ${colDef}`);
    } catch (e) {
      // Column already exists
    }
  }

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
      scorecard_json TEXT,
      overall_score INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    await dbRun(`ALTER TABLE resumes ADD COLUMN overall_score INTEGER`);
    await dbRun(`ALTER TABLE resumes ADD COLUMN scorecard_json TEXT`);
  } catch (e) {}

  // 4. GitHub Project Link Verifications
  await dbRun(`
    CREATE TABLE IF NOT EXISTS github_verifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      repo_url TEXT NOT NULL,
      repo_name TEXT,
      repo_owner TEXT,
      owner TEXT,
      status TEXT NOT NULL,
      description TEXT,
      primary_language TEXT,
      topics_json TEXT,
      stars INTEGER DEFAULT 0,
      forks INTEGER DEFAULT 0,
      open_issues INTEGER DEFAULT 0,
      has_readme INTEGER DEFAULT 0,
      last_updated DATETIME,
      relevance_score INTEGER,
      relevance_notes TEXT,
      matched_skills_json TEXT,
      repo_data_json TEXT,
      analysis_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    await dbRun(`ALTER TABLE github_verifications ADD COLUMN repo_owner TEXT`);
  } catch (e) {}
  try {
    await dbRun(`ALTER TABLE github_verifications ADD COLUMN repo_data_json TEXT`);
  } catch (e) {}
  try {
    await dbRun(`ALTER TABLE github_verifications ADD COLUMN analysis_json TEXT`);
  } catch (e) {}

  // 5. Job Description Matches
  await dbRun(`
    CREATE TABLE IF NOT EXISTS jd_matches (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      resume_id TEXT,
      target_role TEXT,
      jd_title TEXT,
      jd_text TEXT,
      match_score INTEGER,
      matched_skills_json TEXT,
      missing_skills_json TEXT,
      partial_matches_json TEXT,
      relevant_projects_json TEXT,
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
  } catch (e) {}

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

  // 10. Administrator Audit Logs
  await dbRun(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      admin_name TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      target_user_id TEXT,
      target_user_name TEXT,
      details TEXT,
      details_json TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    await dbRun(`ALTER TABLE audit_logs ADD COLUMN target_type TEXT`);
  } catch (e) {}
  try {
    await dbRun(`ALTER TABLE audit_logs ADD COLUMN target_id TEXT`);
  } catch (e) {}
  try {
    await dbRun(`ALTER TABLE audit_logs ADD COLUMN details_json TEXT`);
  } catch (e) {}

  // Seed default demo candidate if not present
  const existingDemo = await dbGet(`SELECT * FROM users WHERE email = ?`, ['demo@skillmatch.ai']);
  if (!existingDemo) {
    const salt = await bcrypt.genSalt(10);
    const demoHash = await bcrypt.hash('password123', salt);
    await dbRun(
      `INSERT INTO users (id, credential_id, roll_number, name, email, phone, department, password_hash, role, college, degree, target_role, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'user-demo',
        'KCE-2024-2024CS01',
        '2024CS01',
        'Demo Candidate',
        'demo@skillmatch.ai',
        '+91 9876543210',
        'Computer Science & Engineering',
        demoHash,
        'student',
        'Karpagam College of Engineering',
        'B.Tech Computer Science & Engineering',
        'Java Developer',
        1
      ]
    );
    console.log('[SkillMatch DB] Seeded demo student: demo@skillmatch.ai / password123 [Roll: 2024CS01 | ID: KCE-2024-2024CS01]');
  } else {
    // Migrate existing demo to KCE-2024-2024CS01 if needed
    await dbRun(`UPDATE users SET credential_id = 'KCE-2024-2024CS01', roll_number = '2024CS01', department = 'Computer Science & Engineering', phone = '+91 9876543210', role = 'student' WHERE id = ?`, [existingDemo.id]);
  }

  // Seed default administrator if not present
  const existingAdmin = await dbGet(`SELECT * FROM users WHERE email = ?`, ['admin@skillmatch.ai']);
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('Admin@2026!', salt);
    await dbRun(
      `INSERT INTO users (id, credential_id, roll_number, name, email, phone, department, password_hash, role, college, degree, target_role, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'user-admin',
        'SKM-ADMIN-01',
        'ADMIN-001',
        'Platform Administrator',
        'admin@skillmatch.ai',
        '+91 9999999999',
        'Administration & Careers',
        adminHash,
        'admin',
        'SkillMatch Central Administration',
        'Executive Leadership',
        'Administrator',
        1
      ]
    );
    console.log('[SkillMatch DB] Seeded administrator: admin@skillmatch.ai / Admin@2026! [ID: SKM-ADMIN-01]');
  }

  console.log('[SkillMatch DB] Initialized successfully. Engine:', useJsEngine ? 'Pure-JS Engine' : 'SQLite3 Binary');
}

export default { dbRun, dbGet, dbAll, initDatabase, generateCredentialId };
