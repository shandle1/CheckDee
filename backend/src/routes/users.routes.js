import express from 'express';
import { body, param, query as queryValidator } from 'express-validator';
import bcrypt from 'bcrypt';
import { query } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all users (admin/manager only)
router.get('/',
  authorizeRoles('admin', 'manager'),
  async (req, res, next) => {
    try {
      const { role, team_id, status, search } = req.query;

      let queryText = `
        SELECT u.id, u.name, u.email, u.role, u.team_id, u.status,
               u.profile_photo, u.phone, u.created_at, u.updated_at,
               t.name as team_name
        FROM users u
        LEFT JOIN teams t ON u.team_id = t.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;

      if (role) {
        queryText += ` AND u.role = $${paramCount}`;
        params.push(role);
        paramCount++;
      }

      if (team_id) {
        queryText += ` AND u.team_id = $${paramCount}`;
        params.push(team_id);
        paramCount++;
      }

      if (status) {
        queryText += ` AND u.status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      if (search) {
        queryText += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
        params.push(`%${search}%`);
        paramCount++;
      }

      queryText += ' ORDER BY u.created_at DESC';

      const result = await query(queryText, params);
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

// Get user by ID
router.get('/:id',
  param('id').isUUID(),
  validate,
  async (req, res, next) => {
    try {
      const result = await query(
        `SELECT u.id, u.name, u.email, u.role, u.team_id, u.status,
                u.profile_photo, u.phone, u.created_at, u.updated_at,
                t.name as team_name
         FROM users u
         LEFT JOIN teams t ON u.team_id = t.id
         WHERE u.id = $1`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Create user (admin only)
router.post('/',
  authorizeRoles('admin'),
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('role').isIn(['admin', 'manager', 'team_leader', 'field_worker']),
    body('team_id').optional().isUUID(),
    body('phone').optional().trim()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password, role, team_id, phone } = req.body;

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Create user
      const result = await query(
        `INSERT INTO users (name, email, password_hash, role, team_id, phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, email, role, team_id, status, phone, created_at`,
        [name, email, password_hash, role, team_id || null, phone || null]
      );

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'user_created', 'user', result.rows[0].id, JSON.stringify({ name, email, role })]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Update user
router.put('/:id',
  authorizeRoles('admin', 'manager'),
  [
    param('id').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['admin', 'manager', 'team_leader', 'field_worker']),
    body('team_id').optional().isUUID(),
    body('status').optional().isIn(['active', 'inactive']),
    body('phone').optional().trim()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Build update query dynamically
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach(key => {
        if (['name', 'email', 'role', 'team_id', 'status', 'phone', 'profile_photo'].includes(key)) {
          fields.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      values.push(id);

      const result = await query(
        `UPDATE users
         SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramCount}
         RETURNING id, name, email, role, team_id, status, phone, profile_photo, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'user_updated', 'user', id, JSON.stringify(updates)]
      );

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Delete user (admin only)
router.delete('/:id',
  authorizeRoles('admin'),
  param('id').isUUID(),
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const result = await query(
        'DELETE FROM users WHERE id = $1 RETURNING id, name, email',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'user_deleted', 'user', id, JSON.stringify(result.rows[0])]
      );

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
