import express from 'express';
import { body, param } from 'express-validator';
import multer from 'multer';
import { query, getClient } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and JPG are allowed.'));
    }
  }
});

// All routes require authentication
router.use(authenticateToken);

// Get all submissions
router.get('/', async (req, res, next) => {
  try {
    const { status, task_id, worker_id } = req.query;

    let queryText = `
      SELECT s.*,
             t.title as task_title,
             u.name as worker_name
      FROM task_submissions s
      LEFT JOIN tasks t ON s.task_id = t.id
      LEFT JOIN users u ON s.worker_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Field workers see only their submissions
    if (req.user.role === 'field_worker') {
      queryText += ` AND s.worker_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    } else if (worker_id) {
      queryText += ` AND s.worker_id = $${paramCount}`;
      params.push(worker_id);
      paramCount++;
    }

    if (status) {
      queryText += ` AND s.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (task_id) {
      queryText += ` AND s.task_id = $${paramCount}`;
      params.push(task_id);
      paramCount++;
    }

    queryText += ' ORDER BY s.created_at DESC';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get submission by ID with full details
router.get('/:id',
  param('id').isUUID(),
  validate,
  async (req, res, next) => {
    try {
      // Get submission
      const submissionResult = await query(
        `SELECT s.*,
                t.title as task_title, t.description as task_description,
                u.name as worker_name, u.email as worker_email
         FROM task_submissions s
         LEFT JOIN tasks t ON s.task_id = t.id
         LEFT JOIN users u ON s.worker_id = u.id
         WHERE s.id = $1`,
        [req.params.id]
      );

      if (submissionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      const submission = submissionResult.rows[0];

      // Get photos
      const photosResult = await query(
        `SELECT id, photo_url, photo_type, caption, metadata, uploaded_at
         FROM submission_photos
         WHERE submission_id = $1
         ORDER BY photo_type, uploaded_at`,
        [req.params.id]
      );

      // Get checklist completion
      const checklistResult = await query(
        `SELECT sci.*, tc.item, tc.is_critical
         FROM submission_checklist_items sci
         LEFT JOIN task_checklists tc ON sci.checklist_item_id = tc.id
         WHERE sci.submission_id = $1
         ORDER BY tc."order"`,
        [req.params.id]
      );

      // Get answers
      const answersResult = await query(
        `SELECT sa.*, tq.question_text, tq.question_type
         FROM submission_answers sa
         LEFT JOIN task_questions tq ON sa.question_id = tq.id
         WHERE sa.submission_id = $1
         ORDER BY tq."order"`,
        [req.params.id]
      );

      // Get reviews
      const reviewsResult = await query(
        `SELECT r.*, u.name as reviewer_name
         FROM task_reviews r
         LEFT JOIN users u ON r.reviewer_id = u.id
         WHERE r.submission_id = $1
         ORDER BY r.reviewed_at DESC`,
        [req.params.id]
      );

      res.json({
        ...submission,
        photos: photosResult.rows,
        checklist: checklistResult.rows,
        answers: answersResult.rows,
        reviews: reviewsResult.rows
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create submission (check-in)
router.post('/',
  authorizeRoles('field_worker'),
  [
    body('task_id').isUUID(),
    body('check_in_latitude').isFloat({ min: -90, max: 90 }),
    body('check_in_longitude').isFloat({ min: -180, max: 180 }),
    body('check_in_accuracy').optional().isFloat()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { task_id, check_in_latitude, check_in_longitude, check_in_accuracy } = req.body;

      // Verify task exists and is assigned to this user
      const taskResult = await query(
        'SELECT id, assigned_to, location_latitude, location_longitude, geofence_radius FROM tasks WHERE id = $1',
        [task_id]
      );

      if (taskResult.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const task = taskResult.rows[0];

      if (task.assigned_to !== req.user.id) {
        return res.status(403).json({ error: 'Task not assigned to you' });
      }

      // Calculate distance (simple Haversine formula)
      const R = 6371000; // Earth's radius in meters
      const lat1 = task.location_latitude * Math.PI / 180;
      const lat2 = check_in_latitude * Math.PI / 180;
      const deltaLat = (check_in_latitude - task.location_latitude) * Math.PI / 180;
      const deltaLon = (check_in_longitude - task.location_longitude) * Math.PI / 180;

      const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      // Check if within geofence
      if (distance > task.geofence_radius) {
        return res.status(400).json({
          error: 'Check-in location outside geofence',
          distance,
          allowed_radius: task.geofence_radius
        });
      }

      // Create submission
      const result = await query(
        `INSERT INTO task_submissions (
          task_id, worker_id, check_in_time, check_in_latitude, check_in_longitude, check_in_accuracy
        ) VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5)
        RETURNING *`,
        [task_id, req.user.id, check_in_latitude, check_in_longitude, check_in_accuracy || null]
      );

      // Update task status
      await query(
        'UPDATE tasks SET status = $1 WHERE id = $2',
        ['in_progress', task_id]
      );

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
        [req.user.id, 'task_checked_in', 'submission', result.rows[0].id]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Update submission (add data, check-out)
router.put('/:id',
  authorizeRoles('field_worker'),
  [
    param('id').isUUID(),
    body('worker_notes').optional().trim(),
    body('checklist_items').optional().isArray(),
    body('answers').optional().isArray(),
    body('check_out').optional().isBoolean()
  ],
  validate,
  async (req, res, next) => {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const { worker_notes, checklist_items, answers, check_out } = req.body;

      // Verify submission belongs to user
      const submissionResult = await client.query(
        'SELECT task_id, worker_id FROM task_submissions WHERE id = $1',
        [id]
      );

      if (submissionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Submission not found' });
      }

      if (submissionResult.rows[0].worker_id !== req.user.id) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Not your submission' });
      }

      // Update submission
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (worker_notes !== undefined) {
        updateFields.push(`worker_notes = $${paramCount}`);
        updateValues.push(worker_notes);
        paramCount++;
      }

      if (check_out) {
        updateFields.push(`check_out_time = CURRENT_TIMESTAMP`);
        updateFields.push(`submitted_at = CURRENT_TIMESTAMP`);
      }

      if (updateFields.length > 0) {
        updateValues.push(id);
        await client.query(
          `UPDATE task_submissions SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
          updateValues
        );
      }

      // Save checklist items
      if (checklist_items && checklist_items.length > 0) {
        for (const item of checklist_items) {
          await client.query(
            `INSERT INTO submission_checklist_items (submission_id, checklist_item_id, completed, completed_at)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (submission_id, checklist_item_id)
             DO UPDATE SET completed = $3, completed_at = $4`,
            [id, item.checklist_item_id, item.completed, item.completed ? new Date() : null]
          );
        }
      }

      // Save answers
      if (answers && answers.length > 0) {
        for (const answer of answers) {
          await client.query(
            `INSERT INTO submission_answers (submission_id, question_id, answer)
             VALUES ($1, $2, $3)
             ON CONFLICT (submission_id, question_id)
             DO UPDATE SET answer = $3, answered_at = CURRENT_TIMESTAMP`,
            [id, answer.question_id, JSON.stringify(answer.answer)]
          );
        }
      }

      // If checking out, update task status
      if (check_out) {
        await client.query(
          'UPDATE tasks SET status = $1 WHERE id = $2',
          ['completed', submissionResult.rows[0].task_id]
        );

        // Log activity
        await client.query(
          'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
          [req.user.id, 'task_submitted', 'submission', id]
        );
      }

      await client.query('COMMIT');

      // Get updated submission
      const updatedResult = await query('SELECT * FROM task_submissions WHERE id = $1', [id]);
      res.json(updatedResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }
);

// Upload photo
router.post('/:id/photos',
  authorizeRoles('field_worker'),
  upload.single('photo'),
  [
    param('id').isUUID(),
    body('photo_type').isIn(['before', 'after']),
    body('caption').optional().trim()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { photo_type, caption } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'No photo uploaded' });
      }

      // Verify submission belongs to user
      const submissionResult = await query(
        'SELECT worker_id FROM task_submissions WHERE id = $1',
        [id]
      );

      if (submissionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      if (submissionResult.rows[0].worker_id !== req.user.id) {
        return res.status(403).json({ error: 'Not your submission' });
      }

      // TODO: Upload to S3 or cloud storage
      // For now, save file info locally
      const photo_url = `/uploads/${Date.now()}-${req.file.originalname}`;
      const metadata = {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      };

      // Save photo record
      const result = await query(
        `INSERT INTO submission_photos (submission_id, photo_url, photo_type, caption, metadata)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [id, photo_url, photo_type, caption || null, JSON.stringify(metadata)]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Review submission (approve/reject)
router.post('/:id/review',
  authorizeRoles('admin', 'manager', 'team_leader'),
  [
    param('id').isUUID(),
    body('action').isIn(['approved', 'rejected', 'info_requested']),
    body('notes').optional().trim()
  ],
  validate,
  async (req, res, next) => {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const { action, notes } = req.body;

      // Get submission
      const submissionResult = await client.query(
        'SELECT task_id, worker_id FROM task_submissions WHERE id = $1',
        [id]
      );

      if (submissionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Submission not found' });
      }

      const { task_id, worker_id } = submissionResult.rows[0];

      // Create review
      await client.query(
        'INSERT INTO task_reviews (submission_id, reviewer_id, action, notes) VALUES ($1, $2, $3, $4)',
        [id, req.user.id, action, notes || null]
      );

      // Update submission status
      await client.query(
        'UPDATE task_submissions SET status = $1 WHERE id = $2',
        [action === 'approved' ? 'approved' : action === 'rejected' ? 'rejected' : 'info_requested', id]
      );

      // Update task status
      if (action === 'approved') {
        await client.query('UPDATE tasks SET status = $1 WHERE id = $2', ['approved', task_id]);
      } else if (action === 'rejected') {
        await client.query('UPDATE tasks SET status = $1 WHERE id = $2', ['rejected', task_id]);
      }

      // Create notification
      const notificationMessages = {
        approved: 'Your task submission has been approved',
        rejected: 'Your task submission was rejected. Please review and resubmit.',
        info_requested: 'Additional information requested for your task submission'
      };

      await client.query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
        [worker_id, `submission_${action}`, 'Submission Review', notificationMessages[action]]
      );

      // Log activity
      await client.query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, `submission_${action}`, 'submission', id, JSON.stringify({ notes })]
      );

      await client.query('COMMIT');

      // Emit socket event
      const io = req.app.get('io');
      io.to(`user_${worker_id}`).emit('submission_reviewed', { submission_id: id, action });

      res.json({ message: 'Review submitted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }
);

export default router;
