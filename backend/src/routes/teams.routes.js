import express from 'express';
import { body, param } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all teams
router.get('/', async (req, res, next) => {
  try {
    const teamsResult = await query(
      `SELECT t.id, t.name, t.description, t.manager_id, t.created_at, t.updated_at,
              u.name as manager_name
       FROM teams t
       LEFT JOIN users u ON t.manager_id = u.id
       ORDER BY t.created_at DESC`
    );

    // Get members for each team
    const teams = await Promise.all(teamsResult.rows.map(async (team) => {
      const membersResult = await query(
        `SELECT id, name, email FROM users WHERE team_id = $1`,
        [team.id]
      );

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        members: membersResult.rows,
        createdAt: team.created_at
      };
    }));

    res.json(teams);
  } catch (error) {
    next(error);
  }
});

// Get team by ID
router.get('/:id',
  param('id').isUUID(),
  validate,
  async (req, res, next) => {
    try {
      const teamResult = await query(
        `SELECT t.id, t.name, t.description, t.manager_id, t.created_at, t.updated_at,
                u.name as manager_name, u.email as manager_email
         FROM teams t
         LEFT JOIN users u ON t.manager_id = u.id
         WHERE t.id = $1`,
        [req.params.id]
      );

      if (teamResult.rows.length === 0) {
        return res.status(404).json({ error: 'Team not found' });
      }

      // Get team members
      const membersResult = await query(
        `SELECT id, name, email, role, status, profile_photo
         FROM users
         WHERE team_id = $1
         ORDER BY role, name`,
        [req.params.id]
      );

      res.json({
        ...teamResult.rows[0],
        members: membersResult.rows
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create team
router.post('/',
  authorizeRoles('admin', 'manager'),
  [
    body('name').trim().notEmpty(),
    body('description').optional().trim(),
    body('manager_id').optional().isUUID()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, description, manager_id } = req.body;

      const result = await query(
        `INSERT INTO teams (name, description, manager_id)
         VALUES ($1, $2, $3)
         RETURNING id, name, description, manager_id, created_at`,
        [name, description || null, manager_id || null]
      );

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'team_created', 'team', result.rows[0].id, JSON.stringify({ name })]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Update team
router.put('/:id',
  authorizeRoles('admin', 'manager'),
  [
    param('id').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('manager_id').optional().isUUID()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach(key => {
        if (['name', 'description', 'manager_id'].includes(key)) {
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
        `UPDATE teams
         SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramCount}
         RETURNING id, name, description, manager_id, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Team not found' });
      }

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'team_updated', 'team', id, JSON.stringify(updates)]
      );

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Delete team
router.delete('/:id',
  authorizeRoles('admin'),
  param('id').isUUID(),
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const result = await query(
        'DELETE FROM teams WHERE id = $1 RETURNING id, name',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Team not found' });
      }

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'team_deleted', 'team', id, JSON.stringify(result.rows[0])]
      );

      res.json({ message: 'Team deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
