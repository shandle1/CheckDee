import express from 'express';
import { body, param } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all settings or filter by category
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const { user } = req;

    let queryStr = 'SELECT * FROM system_settings';
    const queryParams = [];

    // Non-admin users can only see public settings
    if (user.role !== 'admin') {
      queryStr += ' WHERE is_public = true';
    }

    // Filter by category if provided
    if (category) {
      queryStr += user.role === 'admin' ? ' WHERE' : ' AND';
      queryStr += ' category = $1';
      queryParams.push(category);
    }

    queryStr += ' ORDER BY category, key';

    const result = await query(queryStr, queryParams);

    // Group settings by category
    const settingsByCategory = result.rows.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});

    res.json(settingsByCategory);
  } catch (error) {
    next(error);
  }
});

// Get a specific setting
router.get('/:category/:key',
  param('category').trim().notEmpty(),
  param('key').trim().notEmpty(),
  validate,
  async (req, res, next) => {
    try {
      const { category, key } = req.params;
      const { user } = req;

      let queryStr = 'SELECT * FROM system_settings WHERE category = $1 AND key = $2';
      const queryParams = [category, key];

      // Non-admin users can only see public settings
      if (user.role !== 'admin') {
        queryStr += ' AND is_public = true';
      }

      const result = await query(queryStr, queryParams);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Setting not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Update a setting (admin only)
router.put('/:category/:key',
  authorizeRoles('admin'),
  [
    param('category').trim().notEmpty(),
    param('key').trim().notEmpty(),
    body('value').notEmpty()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { category, key } = req.params;
      const { value } = req.body;

      const result = await query(
        `UPDATE system_settings
         SET value = $1, updated_at = CURRENT_TIMESTAMP
         WHERE category = $2 AND key = $3
         RETURNING *`,
        [value, category, key]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Setting not found' });
      }

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'setting_updated', 'system_setting', result.rows[0].id, JSON.stringify({ category, key, value })]
      );

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Bulk update settings (admin only)
router.put('/bulk',
  authorizeRoles('admin'),
  body('settings').isArray(),
  validate,
  async (req, res, next) => {
    try {
      const { settings } = req.body;

      const updatedSettings = [];

      for (const setting of settings) {
        const { category, key, value } = setting;

        const result = await query(
          `UPDATE system_settings
           SET value = $1, updated_at = CURRENT_TIMESTAMP
           WHERE category = $2 AND key = $3
           RETURNING *`,
          [value, category, key]
        );

        if (result.rows.length > 0) {
          updatedSettings.push(result.rows[0]);
        }
      }

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, details) VALUES ($1, $2, $3, $4)',
        [req.user.id, 'settings_bulk_updated', 'system_setting', JSON.stringify({ count: updatedSettings.length })]
      );

      res.json(updatedSettings);
    } catch (error) {
      next(error);
    }
  }
);

// Create a new setting (admin only)
router.post('/',
  authorizeRoles('admin'),
  [
    body('category').trim().notEmpty(),
    body('key').trim().notEmpty(),
    body('value').notEmpty(),
    body('data_type').isIn(['string', 'number', 'boolean', 'json']),
    body('description').optional().trim(),
    body('is_public').optional().isBoolean()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { category, key, value, data_type, description, is_public } = req.body;

      const result = await query(
        `INSERT INTO system_settings (category, key, value, data_type, description, is_public)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [category, key, value, data_type, description || null, is_public || false]
      );

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'setting_created', 'system_setting', result.rows[0].id, JSON.stringify({ category, key })]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Setting already exists' });
      }
      next(error);
    }
  }
);

// Delete a setting (admin only)
router.delete('/:category/:key',
  authorizeRoles('admin'),
  [
    param('category').trim().notEmpty(),
    param('key').trim().notEmpty()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { category, key } = req.params;

      const result = await query(
        'DELETE FROM system_settings WHERE category = $1 AND key = $2 RETURNING *',
        [category, key]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Setting not found' });
      }

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, details) VALUES ($1, $2, $3, $4)',
        [req.user.id, 'setting_deleted', 'system_setting', JSON.stringify({ category, key })]
      );

      res.json({ message: 'Setting deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
