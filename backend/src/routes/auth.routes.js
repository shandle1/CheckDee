import express from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcrypt';
import { query } from '../config/database.js';
import { validate } from '../middleware/validator.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

const router = express.Router();

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Find user
      const result = await query(
        'SELECT id, email, name, password_hash, role, status FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Check if user is active
      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Account is inactive' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email, user.role);
      const refreshToken = generateRefreshToken(user.id);

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
        [user.id, 'login', JSON.stringify({ ip: req.ip })]
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      next(error);
    }
  }
);

// Refresh token
router.post('/refresh',
  body('refreshToken').notEmpty(),
  validate,
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Get user
      const result = await query(
        'SELECT id, email, role, status FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0 || result.rows[0].status !== 'active') {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const user = result.rows[0];

      // Generate new access token
      const accessToken = generateAccessToken(user.id, user.email, user.role);

      res.json({ accessToken });
    } catch (error) {
      next(error);
    }
  }
);

// Get current user
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, email, role, team_id, status, profile_photo, phone,
              created_at, updated_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Logout (client-side token deletion, but log the activity)
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    await query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'logout', JSON.stringify({ ip: req.ip })]
    );

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Get current password hash
      const result = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, req.user.id]
      );

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action) VALUES ($1, $2)',
        [req.user.id, 'password_changed']
      );

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
