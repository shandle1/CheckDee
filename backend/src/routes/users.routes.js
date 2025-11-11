import express from 'express';
import { body, param, query as queryValidator } from 'express-validator';
import bcrypt from 'bcrypt';
import { query } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { generateLinkToken, generateInvitationUrl } from '../utils/linkToken.js';
import { generateLinkingQRCode } from '../utils/qrCode.js';

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

      // Role-based access control for managers
      if (req.user.role === 'manager') {
        const teamCheck = await query(
          'SELECT id FROM users WHERE id = $1 AND team_id = (SELECT team_id FROM users WHERE id = $2)',
          [id, req.user.id]
        );
        if (teamCheck.rows.length === 0) {
          return res.status(403).json({ error: 'You can only edit users from your team' });
        }
      }

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

// Generate invitation link for worker to link LINE account
router.post('/:id/generate-invite',
  authorizeRoles('admin', 'manager'),
  param('id').isUUID(),
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Get user
      const userResult = await query(
        `SELECT id, name, email, phone, role, line_id, linked_at
         FROM users WHERE id = $1`,
        [id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult.rows[0];

      // Only field workers need LINE linking
      if (user.role !== 'field_worker') {
        return res.status(400).json({ error: 'Only field workers can link LINE accounts' });
      }

      // Check if already linked
      if (user.line_id) {
        return res.status(400).json({
          error: 'This user already has a linked LINE account',
          linkedAt: user.linked_at
        });
      }

      // Check if phone number exists
      if (!user.phone) {
        return res.status(400).json({ error: 'User must have a phone number to generate invitation' });
      }

      // Invalidate any existing unused tokens for this user
      await query(
        'UPDATE user_invite_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND used_at IS NULL',
        [id]
      );

      // Generate new link token
      const linkToken = generateLinkToken(id, user.phone);

      // Save token to database
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

      await query(
        `INSERT INTO user_invite_tokens (user_id, token, expires_at, created_by)
         VALUES ($1, $2, $3, $4)`,
        [id, linkToken, expiresAt, req.user.id]
      );

      // Generate invitation URL
      const invitationUrl = generateInvitationUrl(linkToken);

      // Generate QR code
      const qrCode = await generateLinkingQRCode(invitationUrl);

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'invite_generated', 'user', id, JSON.stringify({ workerName: user.name })]
      );

      res.json({
        success: true,
        invitationUrl,
        qrCode, // base64 encoded QR code image
        expiresAt,
        worker: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get LINE linking info for a user
router.get('/:id/line-info',
  authorizeRoles('admin', 'manager'),
  param('id').isUUID(),
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const result = await query(
        `SELECT line_id, line_display_name, line_picture_url, linked_at
         FROM users WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      res.json({
        linked: !!user.line_id,
        lineId: user.line_id,
        displayName: user.line_display_name,
        pictureUrl: user.line_picture_url,
        linkedAt: user.linked_at
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get detailed user information with statistics
router.get('/:id/details',
  param('id').isUUID(),
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Role-based access control
      if (req.user.role === 'manager') {
        // Managers can only view their team members
        const teamCheck = await query(
          'SELECT id FROM users WHERE id = $1 AND team_id = (SELECT team_id FROM users WHERE id = $2)',
          [id, req.user.id]
        );
        if (teamCheck.rows.length === 0) {
          return res.status(403).json({ error: 'You can only view users from your team' });
        }
      } else if (req.user.role === 'field_worker' && id !== req.user.id) {
        // Field workers can only view themselves
        return res.status(403).json({ error: 'You can only view your own profile' });
      }

      // Get user details
      const userResult = await query(
        `SELECT u.id, u.name, u.email, u.role, u.team_id, u.status,
                u.profile_photo, u.phone, u.created_at, u.updated_at,
                u.line_id, u.line_display_name, u.line_picture_url, u.linked_at,
                t.name as team_name
         FROM users u
         LEFT JOIN teams t ON u.team_id = t.id
         WHERE u.id = $1`,
        [id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult.rows[0];

      // Get task statistics if user is a field worker
      let taskStats = null;
      if (user.role === 'field_worker') {
        const statsResult = await query(
          `SELECT
             COUNT(*) as total_assigned,
             COUNT(*) FILTER (WHERE status = 'pending') as pending,
             COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
             COUNT(*) FILTER (WHERE status = 'completed') as completed,
             COUNT(*) FILTER (WHERE status = 'overdue') as overdue
           FROM tasks
           WHERE assigned_to = $1`,
          [id]
        );
        taskStats = statsResult.rows[0];
      }

      res.json({
        user,
        taskStats
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get task statistics for a user
router.get('/:id/task-stats',
  param('id').isUUID(),
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Role-based access control
      if (req.user.role === 'manager') {
        const teamCheck = await query(
          'SELECT id FROM users WHERE id = $1 AND team_id = (SELECT team_id FROM users WHERE id = $2)',
          [id, req.user.id]
        );
        if (teamCheck.rows.length === 0) {
          return res.status(403).json({ error: 'You can only view users from your team' });
        }
      } else if (req.user.role === 'field_worker' && id !== req.user.id) {
        return res.status(403).json({ error: 'You can only view your own statistics' });
      }

      const result = await query(
        `SELECT
           COUNT(*) as total_assigned,
           COUNT(*) FILTER (WHERE status = 'pending') as pending,
           COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
           COUNT(*) FILTER (WHERE status = 'completed') as completed,
           COUNT(*) FILTER (WHERE status = 'overdue') as overdue,
           COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= NOW() - INTERVAL '7 days') as completed_this_week,
           COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= NOW() - INTERVAL '30 days') as completed_this_month
         FROM tasks
         WHERE assigned_to = $1`,
        [id]
      );

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Get task history for a user
router.get('/:id/task-history',
  param('id').isUUID(),
  [
    queryValidator('status').optional().isIn(['pending', 'in_progress', 'completed', 'overdue', 'cancelled']),
    queryValidator('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    queryValidator('offset').optional().isInt({ min: 0 }).toInt()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, limit = 20, offset = 0 } = req.query;

      // Role-based access control
      if (req.user.role === 'manager') {
        const teamCheck = await query(
          'SELECT id FROM users WHERE id = $1 AND team_id = (SELECT team_id FROM users WHERE id = $2)',
          [id, req.user.id]
        );
        if (teamCheck.rows.length === 0) {
          return res.status(403).json({ error: 'You can only view users from your team' });
        }
      } else if (req.user.role === 'field_worker' && id !== req.user.id) {
        return res.status(403).json({ error: 'You can only view your own task history' });
      }

      let queryText = `
        SELECT t.id, t.title, t.description, t.status, t.priority, t.category,
               t.location_name, t.scheduled_start, t.scheduled_end,
               t.completed_at, t.created_at,
               c.name as client_name
        FROM tasks t
        LEFT JOIN clients c ON t.client_id = c.id
        WHERE t.assigned_to = $1
      `;
      const params = [id];
      let paramCount = 2;

      if (status) {
        queryText += ` AND t.status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      queryText += ` ORDER BY t.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await query(queryText, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM tasks WHERE assigned_to = $1';
      const countParams = [id];
      if (status) {
        countQuery += ' AND status = $2';
        countParams.push(status);
      }
      const countResult = await query(countQuery, countParams);

      res.json({
        tasks: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit,
        offset
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get submission history for a user (field workers only)
router.get('/:id/submission-history',
  param('id').isUUID(),
  [
    queryValidator('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    queryValidator('offset').optional().isInt({ min: 0 }).toInt()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      // Role-based access control
      if (req.user.role === 'manager') {
        const teamCheck = await query(
          'SELECT id FROM users WHERE id = $1 AND team_id = (SELECT team_id FROM users WHERE id = $2)',
          [id, req.user.id]
        );
        if (teamCheck.rows.length === 0) {
          return res.status(403).json({ error: 'You can only view users from your team' });
        }
      } else if (req.user.role === 'field_worker' && id !== req.user.id) {
        return res.status(403).json({ error: 'You can only view your own submissions' });
      }

      const result = await query(
        `SELECT ts.id, ts.task_id, ts.status, ts.notes, ts.submitted_at,
                ts.check_in_location, ts.check_in_time,
                ts.photos, ts.quality_score,
                t.title as task_title, t.location_name as task_location
         FROM task_submissions ts
         JOIN tasks t ON ts.task_id = t.id
         WHERE ts.worker_id = $1
         ORDER BY ts.submitted_at DESC
         LIMIT $2 OFFSET $3`,
        [id, limit, offset]
      );

      // Get total count
      const countResult = await query(
        'SELECT COUNT(*) FROM task_submissions WHERE worker_id = $1',
        [id]
      );

      res.json({
        submissions: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit,
        offset
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get activity log for a user
router.get('/:id/activity-log',
  param('id').isUUID(),
  [
    queryValidator('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    queryValidator('offset').optional().isInt({ min: 0 }).toInt()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      // Role-based access control
      if (req.user.role === 'manager') {
        const teamCheck = await query(
          'SELECT id FROM users WHERE id = $1 AND team_id = (SELECT team_id FROM users WHERE id = $2)',
          [id, req.user.id]
        );
        if (teamCheck.rows.length === 0) {
          return res.status(403).json({ error: 'You can only view users from your team' });
        }
      } else if (req.user.role === 'field_worker' && id !== req.user.id) {
        return res.status(403).json({ error: 'You can only view your own activity' });
      }

      const result = await query(
        `SELECT id, action, entity_type, entity_id, details, timestamp
         FROM activity_logs
         WHERE user_id = $1
         ORDER BY timestamp DESC
         LIMIT $2 OFFSET $3`,
        [id, limit, offset]
      );

      // Get total count
      const countResult = await query(
        'SELECT COUNT(*) FROM activity_logs WHERE user_id = $1',
        [id]
      );

      res.json({
        activities: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit,
        offset
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get performance metrics for a user (field workers only)
router.get('/:id/performance-metrics',
  param('id').isUUID(),
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Role-based access control
      if (req.user.role === 'manager') {
        const teamCheck = await query(
          'SELECT id FROM users WHERE id = $1 AND team_id = (SELECT team_id FROM users WHERE id = $2)',
          [id, req.user.id]
        );
        if (teamCheck.rows.length === 0) {
          return res.status(403).json({ error: 'You can only view users from your team' });
        }
      } else if (req.user.role === 'field_worker' && id !== req.user.id) {
        return res.status(403).json({ error: 'You can only view your own metrics' });
      }

      // Calculate completion rate
      const completionResult = await query(
        `SELECT
           COUNT(*) as total_tasks,
           COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
           ROUND(
             (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
             2
           ) as completion_rate
         FROM tasks
         WHERE assigned_to = $1`,
        [id]
      );

      // Calculate average quality score
      const qualityResult = await query(
        `SELECT
           ROUND(AVG(quality_score), 2) as average_quality_score,
           COUNT(*) FILTER (WHERE quality_score IS NOT NULL) as scored_submissions
         FROM task_submissions
         WHERE worker_id = $1`,
        [id]
      );

      // Get monthly completion trend (last 6 months)
      const trendResult = await query(
        `SELECT
           DATE_TRUNC('month', completed_at) as month,
           COUNT(*) as completed_count
         FROM tasks
         WHERE assigned_to = $1 AND status = 'completed'
           AND completed_at >= NOW() - INTERVAL '6 months'
         GROUP BY DATE_TRUNC('month', completed_at)
         ORDER BY month ASC`,
        [id]
      );

      // Get average quality score trend (last 6 months)
      const qualityTrendResult = await query(
        `SELECT
           DATE_TRUNC('month', submitted_at) as month,
           ROUND(AVG(quality_score), 2) as avg_quality
         FROM task_submissions
         WHERE worker_id = $1 AND quality_score IS NOT NULL
           AND submitted_at >= NOW() - INTERVAL '6 months'
         GROUP BY DATE_TRUNC('month', submitted_at)
         ORDER BY month ASC`,
        [id]
      );

      res.json({
        completionRate: completionResult.rows[0].completion_rate || 0,
        totalTasks: parseInt(completionResult.rows[0].total_tasks),
        completedTasks: parseInt(completionResult.rows[0].completed_tasks),
        averageQualityScore: qualityResult.rows[0].average_quality_score || 0,
        scoredSubmissions: parseInt(qualityResult.rows[0].scored_submissions),
        completionTrend: trendResult.rows,
        qualityTrend: qualityTrendResult.rows
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get location history for a user (field workers only)
router.get('/:id/location-history',
  param('id').isUUID(),
  [
    queryValidator('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    queryValidator('offset').optional().isInt({ min: 0 }).toInt()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // Role-based access control
      if (req.user.role === 'manager') {
        const teamCheck = await query(
          'SELECT id FROM users WHERE id = $1 AND team_id = (SELECT team_id FROM users WHERE id = $2)',
          [id, req.user.id]
        );
        if (teamCheck.rows.length === 0) {
          return res.status(403).json({ error: 'You can only view users from your team' });
        }
      } else if (req.user.role === 'field_worker' && id !== req.user.id) {
        return res.status(403).json({ error: 'You can only view your own location history' });
      }

      // Get check-in locations from task submissions
      const result = await query(
        `SELECT
           ts.id, ts.task_id, ts.check_in_location, ts.check_in_time,
           t.title as task_title, t.location_name as task_location,
           t.latitude as task_latitude, t.longitude as task_longitude
         FROM task_submissions ts
         JOIN tasks t ON ts.task_id = t.id
         WHERE ts.worker_id = $1 AND ts.check_in_location IS NOT NULL
         ORDER BY ts.check_in_time DESC
         LIMIT $2 OFFSET $3`,
        [id, limit, offset]
      );

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*)
         FROM task_submissions
         WHERE worker_id = $1 AND check_in_location IS NOT NULL`,
        [id]
      );

      res.json({
        locations: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit,
        offset
      });
    } catch (error) {
      next(error);
    }
  }
);

// Unlink LINE account
router.post('/:id/unlink-line',
  authorizeRoles('admin', 'manager'),
  param('id').isUUID(),
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Role-based access control for managers
      if (req.user.role === 'manager') {
        const teamCheck = await query(
          'SELECT id FROM users WHERE id = $1 AND team_id = (SELECT team_id FROM users WHERE id = $2)',
          [id, req.user.id]
        );
        if (teamCheck.rows.length === 0) {
          return res.status(403).json({ error: 'You can only manage users from your team' });
        }
      }

      const result = await query(
        `UPDATE users
         SET line_id = NULL,
             line_display_name = NULL,
             line_picture_url = NULL,
             linked_at = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, name, email`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'line_account_unlinked', 'user', id, JSON.stringify({ userName: result.rows[0].name })]
      );

      res.json({
        success: true,
        message: 'LINE account unlinked successfully',
        user: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }
);

// Export users to CSV (admin only)
router.get('/export/csv',
  authorizeRoles('admin'),
  async (req, res, next) => {
    try {
      const result = await query(`
        SELECT u.id, u.name, u.email, u.role, u.status, u.phone,
               t.name as team_name, u.created_at
        FROM users u
        LEFT JOIN teams t ON u.team_id = t.id
        ORDER BY u.created_at DESC
      `);

      // Create CSV content
      const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Phone', 'Team', 'Created At'];
      const csvRows = [headers.join(',')];

      result.rows.forEach(user => {
        const row = [
          user.id,
          `"${user.name}"`,
          user.email,
          user.role,
          user.status,
          user.phone || '',
          user.team_name ? `"${user.team_name}"` : '',
          new Date(user.created_at).toISOString()
        ];
        csvRows.push(row.join(','));
      });

      const csv = csvRows.join('\n');

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, details) VALUES ($1, $2, $3, $4)',
        [req.user.id, 'users_exported', 'user', JSON.stringify({ count: result.rows.length })]
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=users-${Date.now()}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
);

// Bulk update users (admin only)
router.put('/bulk',
  authorizeRoles('admin'),
  body('userIds').isArray(),
  body('updates').isObject(),
  validate,
  async (req, res, next) => {
    try {
      const { userIds, updates } = req.body;
      const allowedUpdates = ['role', 'status', 'team_id'];

      // Filter only allowed updates
      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({ error: 'No valid updates provided' });
      }

      // Build dynamic UPDATE query
      const setClauses = [];
      const values = [];
      let paramCount = 1;

      Object.entries(filteredUpdates).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          setClauses.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

      // Add userIds to values
      values.push(userIds);

      const queryText = `
        UPDATE users
        SET ${setClauses.join(', ')}
        WHERE id = ANY($${paramCount}::uuid[])
        RETURNING id, name, email, role, status, team_id
      `;

      const result = await query(queryText, values);

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, details) VALUES ($1, $2, $3, $4)',
        [req.user.id, 'users_bulk_updated', 'user', JSON.stringify({
          count: result.rows.length,
          updates: filteredUpdates
        })]
      );

      res.json({
        success: true,
        updated: result.rows.length,
        users: result.rows
      });
    } catch (error) {
      next(error);
    }
  }
);

// Bulk delete users (admin only)
router.delete('/bulk',
  authorizeRoles('admin'),
  body('userIds').isArray(),
  validate,
  async (req, res, next) => {
    try {
      const { userIds } = req.body;

      // Prevent deleting self
      if (userIds.includes(req.user.id)) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const result = await query(
        'DELETE FROM users WHERE id = ANY($1::uuid[]) RETURNING id, name',
        [userIds]
      );

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, details) VALUES ($1, $2, $3, $4)',
        [req.user.id, 'users_bulk_deleted', 'user', JSON.stringify({
          count: result.rows.length,
          deletedUsers: result.rows
        })]
      );

      res.json({
        success: true,
        deleted: result.rows.length,
        users: result.rows
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
