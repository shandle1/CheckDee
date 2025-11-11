import express from 'express';
import { body } from 'express-validator';
import { query } from '../config/database.js';
import { validate } from '../middleware/validator.js';
import { verifyLiffToken, getLINEProfile, sendLinkingNotification } from '../utils/line.js';
import { verifyLinkToken } from '../utils/linkToken.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

const router = express.Router();

/**
 * POST /api/line/auth
 * Authenticate a user via LINE LIFF token
 * If user is linked, returns JWT tokens
 * If not linked, returns linking status
 */
router.post('/auth',
  [
    body('liffToken').notEmpty().withMessage('LIFF token is required')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { liffToken } = req.body;

      // Verify LIFF token with LINE
      const verification = await verifyLiffToken(liffToken);
      if (!verification.valid) {
        return res.status(401).json({ error: 'Invalid LIFF token' });
      }

      // Get LINE profile
      const lineProfile = await getLINEProfile(liffToken);

      // Check if LINE user ID is linked to an account
      const result = await query(
        `SELECT id, email, name, role, status, team_id, line_id, line_display_name,
                line_picture_url, linked_at
         FROM users WHERE line_id = $1`,
        [lineProfile.userId]
      );

      if (result.rows.length === 0) {
        // Not linked
        return res.status(200).json({
          linked: false,
          lineProfile: {
            userId: lineProfile.userId,
            displayName: lineProfile.displayName,
            pictureUrl: lineProfile.pictureUrl
          },
          message: 'LINE account not linked. Please complete account linking.'
        });
      }

      const user = result.rows[0];

      // Check if user is active
      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Account is inactive' });
      }

      // Generate JWT tokens
      const accessToken = generateAccessToken(user.id, user.email, user.role);
      const refreshToken = generateRefreshToken(user.id);

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
        [user.id, 'line_login', JSON.stringify({ lineUserId: lineProfile.userId })]
      );

      res.json({
        linked: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          lineProfile: {
            userId: lineProfile.userId,
            displayName: lineProfile.displayName,
            pictureUrl: lineProfile.pictureUrl
          }
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/line/link-phone
 * Link LINE account using phone number
 */
router.post('/link-phone',
  [
    body('liffToken').notEmpty().withMessage('LIFF token is required'),
    body('phone').notEmpty().withMessage('Phone number is required')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { liffToken, phone } = req.body;

      // Verify LIFF token
      const verification = await verifyLiffToken(liffToken);
      if (!verification.valid) {
        return res.status(401).json({ error: 'Invalid LIFF token' });
      }

      // Get LINE profile
      const lineProfile = await getLINEProfile(liffToken);

      // Check if this LINE ID is already linked
      const existingLink = await query(
        'SELECT id FROM users WHERE line_id = $1',
        [lineProfile.userId]
      );

      if (existingLink.rows.length > 0) {
        return res.status(400).json({ error: 'This LINE account is already linked to another user' });
      }

      // Find user by phone number (case-insensitive, trim whitespace)
      const normalizedPhone = phone.trim();
      const userResult = await query(
        `SELECT id, email, name, role, status FROM users
         WHERE LOWER(TRIM(phone)) = LOWER($1) AND role = 'field_worker'`,
        [normalizedPhone]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'No worker account found with this phone number' });
      }

      const user = userResult.rows[0];

      if (user.status !== 'active') {
        return res.status(403).json({ error: 'This account is inactive. Please contact your manager.' });
      }

      // Link LINE account
      await query(
        `UPDATE users
         SET line_id = $1,
             line_display_name = $2,
             line_picture_url = $3,
             linked_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [lineProfile.userId, lineProfile.displayName, lineProfile.pictureUrl, user.id]
      );

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
        [user.id, 'line_account_linked', JSON.stringify({ method: 'phone', lineUserId: lineProfile.userId })]
      );

      // Send notification
      await sendLinkingNotification(lineProfile.userId, user.name);

      // Generate JWT tokens
      const accessToken = generateAccessToken(user.id, user.email, user.role);
      const refreshToken = generateRefreshToken(user.id);

      res.json({
        success: true,
        message: 'LINE account linked successfully',
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

/**
 * POST /api/line/link-token
 * Link LINE account using invitation token
 */
router.post('/link-token',
  [
    body('liffToken').notEmpty().withMessage('LIFF token is required'),
    body('linkToken').notEmpty().withMessage('Link token is required')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { liffToken, linkToken } = req.body;

      // Verify LIFF token
      const verification = await verifyLiffToken(liffToken);
      if (!verification.valid) {
        return res.status(401).json({ error: 'Invalid LIFF token' });
      }

      // Get LINE profile
      const lineProfile = await getLINEProfile(liffToken);

      // Check if this LINE ID is already linked
      const existingLink = await query(
        'SELECT id FROM users WHERE line_id = $1',
        [lineProfile.userId]
      );

      if (existingLink.rows.length > 0) {
        return res.status(400).json({ error: 'This LINE account is already linked to another user' });
      }

      // Verify link token
      let decoded;
      try {
        decoded = verifyLinkToken(linkToken);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }

      // Check if token has been used
      const tokenResult = await query(
        'SELECT id, user_id, used_at FROM user_invite_tokens WHERE token = $1',
        [linkToken]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid link token' });
      }

      const tokenRecord = tokenResult.rows[0];

      if (tokenRecord.used_at) {
        return res.status(400).json({ error: 'This invitation link has already been used' });
      }

      // Get user
      const userResult = await query(
        'SELECT id, email, name, role, status FROM users WHERE id = $1',
        [tokenRecord.user_id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult.rows[0];

      if (user.status !== 'active') {
        return res.status(403).json({ error: 'This account is inactive. Please contact your manager.' });
      }

      // Link LINE account
      await query(
        `UPDATE users
         SET line_id = $1,
             line_display_name = $2,
             line_picture_url = $3,
             linked_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [lineProfile.userId, lineProfile.displayName, lineProfile.pictureUrl, user.id]
      );

      // Mark token as used
      await query(
        'UPDATE user_invite_tokens SET used_at = CURRENT_TIMESTAMP, used_by_line_id = $1 WHERE id = $2',
        [lineProfile.userId, tokenRecord.id]
      );

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
        [user.id, 'line_account_linked', JSON.stringify({ method: 'token', lineUserId: lineProfile.userId })]
      );

      // Send notification
      await sendLinkingNotification(lineProfile.userId, user.name);

      // Generate JWT tokens
      const accessToken = generateAccessToken(user.id, user.email, user.role);
      const refreshToken = generateRefreshToken(user.id);

      res.json({
        success: true,
        message: 'LINE account linked successfully',
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

/**
 * GET /api/line/link-status/:lineUserId
 * Check if a LINE user ID is linked
 */
router.get('/link-status/:lineUserId',
  async (req, res, next) => {
    try {
      const { lineUserId } = req.params;

      const result = await query(
        `SELECT id, name, role, linked_at
         FROM users WHERE line_id = $1`,
        [lineUserId]
      );

      if (result.rows.length === 0) {
        return res.json({ linked: false });
      }

      res.json({
        linked: true,
        user: {
          id: result.rows[0].id,
          name: result.rows[0].name,
          role: result.rows[0].role,
          linkedAt: result.rows[0].linked_at
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
