import jwt from 'jsonwebtoken';
import { dbGet } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'skillmatch-ai-jwt-secret-key-2026-production';

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      credentialId: user.credential_id,
      email: user.email,
      name: user.name
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
          name: user.name,
          email: user.email,
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

  // Fallback to active demo user if unauthenticated
  const demoUser = await dbGet('SELECT * FROM users WHERE email = ?', ['demo@skillmatch.ai']);
  if (demoUser) {
    req.user = {
      id: demoUser.id,
      credentialId: demoUser.credential_id,
      name: demoUser.name,
      email: demoUser.email,
      college: demoUser.college,
      degree: demoUser.degree,
      targetRole: demoUser.target_role,
      emailVerified: Boolean(demoUser.email_verified)
    };
  } else {
    req.user = {
      id: 'guest-user',
      credentialId: 'SKM-2026-GUEST1',
      name: 'Guest Candidate',
      email: 'guest@skillmatch.ai',
      college: 'University',
      degree: 'B.Tech CS',
      targetRole: 'Java Developer',
      emailVerified: false
    };
  }
  next();
}

export function requireStrictAuth(req, res, next) {
  if (!req.user || req.user.id === 'guest-user') {
    return res.status(401).json({ error: 'Authentication required. Please log in or register.' });
  }
  next();
}
