import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { verifyLiffToken, getLINEProfile } from '../utils/line.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and is active
    const result = await query(
      'SELECT id, email, name, role, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (result.rows[0].status !== 'active') {
      return res.status(403).json({ error: 'User account is inactive' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Authenticate using LIFF access token
 * Alternative to JWT authentication for LIFF app users
 */
export const authenticateLIFF = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'LIFF access token required' });
    }

    // Verify LIFF token with LINE
    const verification = await verifyLiffToken(token);
    if (!verification.valid) {
      return res.status(401).json({ error: 'Invalid LIFF token' });
    }

    // Get LINE profile
    const lineProfile = await getLINEProfile(token);

    // Find user by LINE ID
    const result = await query(
      `SELECT id, email, name, role, status, line_id
       FROM users WHERE line_id = $1`,
      [lineProfile.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'LINE account not linked',
        lineProfile: {
          userId: lineProfile.userId,
          displayName: lineProfile.displayName
        }
      });
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'User account is inactive' });
    }

    req.user = user;
    req.lineProfile = lineProfile;
    next();
  } catch (error) {
    console.error('LIFF authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};
