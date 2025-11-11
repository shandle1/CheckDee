import express from 'express';
import { body, param, query as queryValidator } from 'express-validator';
import { query, getClient } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all tasks with filters
router.get('/', async (req, res, next) => {
  try {
    const { status, priority, assigned_to, team_id, due_before, due_after } = req.query;

    let queryText = `
      SELECT t.*,
             u.name as assigned_to_name,
             creator.name as created_by_name,
             (SELECT COUNT(*) FROM task_checklists WHERE task_id = t.id) as checklist_count,
             (SELECT COUNT(*) FROM task_questions WHERE task_id = t.id) as questions_count
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Filter by assigned user (field workers see only their tasks)
    if (req.user.role === 'field_worker') {
      queryText += ` AND t.assigned_to = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    } else if (assigned_to) {
      queryText += ` AND t.assigned_to = $${paramCount}`;
      params.push(assigned_to);
      paramCount++;
    }

    // Team filter for managers/team leaders
    if (team_id) {
      queryText += ` AND u.team_id = $${paramCount}`;
      params.push(team_id);
      paramCount++;
    }

    if (status) {
      queryText += ` AND t.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (priority) {
      queryText += ` AND t.priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    if (due_before) {
      queryText += ` AND t.due_date <= $${paramCount}`;
      params.push(due_before);
      paramCount++;
    }

    if (due_after) {
      queryText += ` AND t.due_date >= $${paramCount}`;
      params.push(due_after);
      paramCount++;
    }

    queryText += ' ORDER BY t.due_date ASC, t.priority DESC';

    const result = await query(queryText, params);

    // Transform data to match frontend expectations
    const tasks = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      assignedTo: row.assigned_to ? {
        id: row.assigned_to,
        name: row.assigned_to_name,
        email: '' // Email not included in this query
      } : null,
      location: {
        latitude: parseFloat(row.location_latitude),
        longitude: parseFloat(row.location_longitude),
        address: row.location_address
      },
      dueDate: row.due_date,
      createdAt: row.created_at
    }));

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Get task by ID with full details
router.get('/:id',
  param('id').isUUID(),
  validate,
  async (req, res, next) => {
    try {
      // Get task details
      const taskResult = await query(
        `SELECT t.*,
                u.name as assigned_to_name, u.email as assigned_to_email,
                creator.name as created_by_name
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         LEFT JOIN users creator ON t.created_by = creator.id
         WHERE t.id = $1`,
        [req.params.id]
      );

      if (taskResult.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const task = taskResult.rows[0];

      // Get checklist items
      const checklistResult = await query(
        `SELECT id, item, is_critical, "order"
         FROM task_checklists
         WHERE task_id = $1
         ORDER BY "order"`,
        [req.params.id]
      );

      // Get questions
      const questionsResult = await query(
        `SELECT id, question_text, question_type, options, required, help_text, "order", conditional_logic
         FROM task_questions
         WHERE task_id = $1
         ORDER BY "order"`,
        [req.params.id]
      );

      // Get submission if exists
      const submissionResult = await query(
        `SELECT s.*, u.name as worker_name
         FROM task_submissions s
         LEFT JOIN users u ON s.worker_id = u.id
         WHERE s.task_id = $1
         ORDER BY s.created_at DESC
         LIMIT 1`,
        [req.params.id]
      );

      // Transform to camelCase format
      const transformedTask = {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assigned_to ? {
          id: task.assigned_to,
          name: task.assigned_to_name,
          email: task.assigned_to_email
        } : null,
        location: {
          latitude: parseFloat(task.location_latitude),
          longitude: parseFloat(task.location_longitude),
          address: task.location_address,
          notes: task.location_notes
        },
        geofenceRadius: task.geofence_radius,
        dueDate: task.due_date,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        createdBy: task.created_by ? {
          id: task.created_by,
          name: task.created_by_name
        } : null,
        beforePhotosCount: task.before_photos_count,
        beforePhotosInstructions: task.before_photos_instructions,
        afterPhotosCount: task.after_photos_count,
        afterPhotosInstructions: task.after_photos_instructions,
        checklist: checklistResult.rows.map(item => ({
          id: item.id,
          item: item.item,
          isCritical: item.is_critical,
          order: item.order
        })),
        questions: questionsResult.rows.map(q => ({
          id: q.id,
          questionText: q.question_text,
          questionType: q.question_type,
          options: q.options,
          required: q.required,
          helpText: q.help_text,
          order: q.order,
          conditionalLogic: q.conditional_logic
        })),
        submission: submissionResult.rows[0] || null
      };

      res.json(transformedTask);
    } catch (error) {
      next(error);
    }
  }
);

// Create task
router.post('/',
  authorizeRoles('admin', 'manager', 'team_leader'),
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('location_address').trim().notEmpty(),
    body('location_latitude').isFloat({ min: -90, max: 90 }),
    body('location_longitude').isFloat({ min: -180, max: 180 }),
    body('location_notes').optional().trim(),
    body('geofence_radius').optional().isInt({ min: 10, max: 10000 }),
    body('assigned_to').optional({ nullable: true }).isUUID(),
    body('due_date').isISO8601(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('before_photos_count').optional().isInt({ min: 0, max: 10 }),
    body('after_photos_count').optional().isInt({ min: 0, max: 10 }),
    body('checklist').optional().isArray(),
    body('questions').optional().isArray()
  ],
  validate,
  async (req, res, next) => {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const {
        title, description, location_address, location_latitude, location_longitude,
        location_notes, geofence_radius, assigned_to, due_date, priority,
        before_photos_count, before_photos_instructions,
        after_photos_count, after_photos_instructions,
        checklist, questions
      } = req.body;

      // Create task
      const taskResult = await client.query(
        `INSERT INTO tasks (
          title, description, location_address, location_latitude, location_longitude,
          location_notes, geofence_radius, assigned_to, due_date, priority,
          before_photos_count, before_photos_instructions,
          after_photos_count, after_photos_instructions, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          title, description, location_address, location_latitude, location_longitude,
          location_notes || null, geofence_radius || 100, assigned_to, due_date,
          priority || 'normal', before_photos_count || 2, before_photos_instructions || null,
          after_photos_count || 2, after_photos_instructions || null, req.user.id
        ]
      );

      const task = taskResult.rows[0];

      // Add checklist items
      if (checklist && checklist.length > 0) {
        for (let i = 0; i < checklist.length; i++) {
          await client.query(
            'INSERT INTO task_checklists (task_id, item, is_critical, "order") VALUES ($1, $2, $3, $4)',
            [task.id, checklist[i].item, checklist[i].is_critical || false, i]
          );
        }
      }

      // Add questions
      if (questions && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          await client.query(
            `INSERT INTO task_questions (
              task_id, question_text, question_type, options, required, help_text, "order", conditional_logic
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              task.id, questions[i].question_text, questions[i].question_type,
              JSON.stringify(questions[i].options || null), questions[i].required !== false,
              questions[i].help_text || null, i, JSON.stringify(questions[i].conditional_logic || null)
            ]
          );
        }
      }

      // Log activity
      await client.query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'task_created', 'task', task.id, JSON.stringify({ title, assigned_to })]
      );

      // Create notification for assigned user
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES ($1, $2, $3, $4)`,
        [assigned_to, 'task_assigned', 'New Task Assigned', `You have been assigned: ${title}`]
      );

      await client.query('COMMIT');

      // Emit socket event
      const io = req.app.get('io');
      io.to(`user_${assigned_to}`).emit('task_assigned', { task_id: task.id, title });

      res.status(201).json(task);
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }
);

// Update task
router.put('/:id',
  authorizeRoles('admin', 'manager', 'team_leader'),
  [
    param('id').isUUID(),
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('status').optional().isIn(['assigned', 'in_progress', 'completed', 'approved', 'rejected']),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    body('due_date').optional().isISO8601()
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
        if (['title', 'description', 'status', 'priority', 'due_date', 'location_notes'].includes(key)) {
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
        `UPDATE tasks
         SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'task_updated', 'task', id, JSON.stringify(updates)]
      );

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Delete task
router.delete('/:id',
  authorizeRoles('admin', 'manager'),
  param('id').isUUID(),
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const result = await query(
        'DELETE FROM tasks WHERE id = $1 RETURNING id, title',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, 'task_deleted', 'task', id, JSON.stringify(result.rows[0])]
      );

      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
