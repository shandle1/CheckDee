import express from 'express';
import { query as queryValidator } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication and admin/manager role
router.use(authenticateToken);
router.use(authorizeRoles('admin', 'manager'));

// Get overall platform statistics
router.get('/overview', async (req, res, next) => {
  try {
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'field_worker') as total_workers,
        (SELECT COUNT(*) FROM teams) as total_teams,
        (SELECT COUNT(*) FROM tasks) as total_tasks,
        (SELECT COUNT(*) FROM task_submissions) as total_submissions,
        (SELECT COUNT(*) FROM task_submissions WHERE status = 'approved') as approved_submissions,
        (SELECT COUNT(*) FROM task_submissions WHERE status = 'pending') as pending_submissions,
        (SELECT ROUND(AVG(quality_score), 2) FROM task_submissions WHERE quality_score IS NOT NULL) as avg_quality_score,
        (SELECT COUNT(*) FROM tasks WHERE due_date < CURRENT_TIMESTAMP AND status != 'completed') as overdue_tasks
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get worker performance statistics
router.get('/workers', async (req, res, next) => {
  try {
    const { team_id, limit } = req.query;

    let queryText = 'SELECT * FROM worker_performance_stats';
    const params = [];
    let paramCount = 1;

    if (team_id) {
      queryText += ` WHERE team_id = $${paramCount}`;
      params.push(team_id);
      paramCount++;
    }

    queryText += ' ORDER BY total_submissions DESC';

    if (limit) {
      queryText += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit));
    }

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get team performance statistics
router.get('/teams', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT * FROM team_performance_stats
      ORDER BY total_submissions DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get task type statistics
router.get('/task-types', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT * FROM task_type_stats
      ORDER BY total_tasks DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get submission trends over time
router.get('/trends/submissions', async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const result = await query(`
      SELECT
        DATE(submitted_at) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        ROUND(AVG(quality_score), 2) as avg_quality_score
      FROM task_submissions
      WHERE submitted_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(submitted_at)
      ORDER BY date DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get quality score distribution
router.get('/quality-distribution', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        CASE
          WHEN quality_score >= 90 THEN '90-100'
          WHEN quality_score >= 80 THEN '80-89'
          WHEN quality_score >= 70 THEN '70-79'
          WHEN quality_score >= 60 THEN '60-69'
          ELSE 'Below 60'
        END as score_range,
        COUNT(*) as count
      FROM task_submissions
      WHERE quality_score IS NOT NULL
      GROUP BY score_range
      ORDER BY score_range DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get top performers
router.get('/top-performers', async (req, res, next) => {
  try {
    const { metric = 'quality_score', limit = 10 } = req.query;

    const validMetrics = ['quality_score', 'approval_rate', 'total_submissions'];
    const orderBy = validMetrics.includes(metric) ? metric : 'quality_score';

    const result = await query(`
      SELECT
        worker_id,
        worker_name,
        team_name,
        total_submissions,
        approved_count,
        avg_quality_score,
        approval_rate
      FROM worker_performance_stats
      WHERE total_submissions > 0
      ORDER BY ${orderBy === 'quality_score' ? 'avg_quality_score' : orderBy} DESC NULLS LAST
      LIMIT $1
    `, [parseInt(limit)]);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get worker detailed analytics
router.get('/workers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    // Get worker basic stats
    const workerStats = await query(`
      SELECT * FROM worker_performance_stats
      WHERE worker_id = $1
    `, [id]);

    if (workerStats.rows.length === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Get submission history
    const submissionHistory = await query(`
      SELECT
        DATE(submitted_at) as date,
        COUNT(*) as submissions,
        AVG(quality_score) as avg_quality,
        AVG(completion_time) as avg_time
      FROM task_submissions
      WHERE worker_id = $1
        AND submitted_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(submitted_at)
      ORDER BY date DESC
    `, [id]);

    // Get recent submissions
    const recentSubmissions = await query(`
      SELECT
        ts.id,
        t.title as task_title,
        ts.status,
        ts.quality_score,
        ts.completion_time,
        ts.submitted_at
      FROM task_submissions ts
      JOIN tasks t ON ts.task_id = t.id
      WHERE ts.worker_id = $1
      ORDER BY ts.submitted_at DESC
      LIMIT 10
    `, [id]);

    res.json({
      stats: workerStats.rows[0],
      submissionHistory: submissionHistory.rows,
      recentSubmissions: recentSubmissions.rows
    });
  } catch (error) {
    next(error);
  }
});

// Get team comparison metrics
router.get('/teams/comparison', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        team_id,
        team_name,
        member_count,
        total_submissions,
        approved_count,
        avg_quality_score,
        avg_completion_time,
        ROUND(approved_count::float / NULLIF(total_submissions, 0) * 100, 2) as approval_rate,
        completed_tasks,
        overdue_tasks
      FROM team_performance_stats
      WHERE member_count > 0
      ORDER BY avg_quality_score DESC NULLS LAST
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get completion time analysis
router.get('/completion-time', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        tt.name as task_type,
        COUNT(ts.id) as submission_count,
        ROUND(AVG(ts.completion_time), 2) as avg_time,
        ROUND(MIN(ts.completion_time), 2) as min_time,
        ROUND(MAX(ts.completion_time), 2) as max_time,
        tt.estimated_duration_minutes as estimated_time
      FROM task_submissions ts
      JOIN tasks t ON ts.task_id = t.id
      LEFT JOIN task_types tt ON t.task_type_id = tt.id
      WHERE ts.completion_time IS NOT NULL
      GROUP BY tt.id, tt.name, tt.estimated_duration_minutes
      ORDER BY avg_time DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
