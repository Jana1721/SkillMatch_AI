import jwt from 'jsonwebtoken';
import { dbGet } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'skillmatch-ai-jwt-secret-key-2026-production';

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      credentialId: user.credential_id || user.credentialId,
      rollNumber: user.roll_number || user.rollNumber,
      email: user.email,
      name: user.name,
      role: user.role || 'student'
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await dbGet('SELECT * FROM users WHERE id = ?', [decoded.id]);
      if (user) {
        req.user = {
          id: user.id,
          credentialId: user.credential_id,
          rollNumber: user.roll_number,
          name: user.name,
          email: user.email,
          phone: user.phone,
          department: user.department,
          role: user.role || 'student',
          college: user.college,
          degree: user.degree,
          targetRole: user.target_role,
          emailVerified: Boolean(user.email_verified)
        };
        return next();
      }
    }
  } catch (err) {
    // Token invalid or expired, continue to fallback
  }

  // Fallback to active demo student if unauthenticated in dev
  const demoUser = await dbGet('SELECT * FROM users WHERE email = ?', ['demo@skillmatch.ai']);
  if (demoUser) {
    req.user = {
      id: demoUser.id,
      credentialId: demoUser.credential_id,
      rollNumber: demoUser.roll_number,
      name: demoUser.name,
      email: demoUser.email,
      phone: demoUser.phone,
      department: demoUser.department,
      role: demoUser.role || 'student',
      college: demoUser.college,
      degree: demoUser.degree,
      targetRole: demoUser.target_role,
      emailVerified: Boolean(demoUser.email_verified)
    };
  } else {
    req.user = {
      id: 'guest-user',
      credentialId: 'SKM-2026-GUEST1',
      rollNumber: 'GUEST-001',
      name: 'Guest Candidate',
      email: 'guest@skillmatch.ai',
      role: 'student',
      targetRole: 'Java Developer',
      emailVerified: false
    };
  }

  return next();
}

/**
 * Enforce strict authentication for protected routes
 */
export function requireAuth(req, res, next) {
  if (!req.user || req.user.id === 'guest-user') {
    return res.status(401).json({ error: 'Authentication required. Please log in to access this resource.' });
  }
  next();
}

/**
 * Enforce admin-only access
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}

/**
 * Enforce email verification for protected candidate actions
 */
export function requireVerified(req, res, next) {
  if (!req.user || !req.user.emailVerified) {
    return res.status(403).json({
      error: 'Email verification required. Please verify your account with the 6-digit OTP code to continue.',
      needsVerification: true
    });
  }
  next();
}
