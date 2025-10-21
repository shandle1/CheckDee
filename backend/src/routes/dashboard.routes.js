import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get dashboard statistics
router.get('/stats', async (req, res, next) => {
  try {
    // Get total tasks
    const totalResult = await query('SELECT COUNT(*) as count FROM tasks');
    const totalTasks = parseInt(totalResult.rows[0].count);

    // Get pending tasks (assigned or in_progress)
    const pendingResult = await query(
      "SELECT COUNT(*) as count FROM tasks WHERE status IN ('assigned', 'in_progress')"
    );
    const pendingTasks = parseInt(pendingResult.rows[0].count);

    // Get completed tasks
    const completedResult = await query(
      "SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'"
    );
    const completedTasks = parseInt(completedResult.rows[0].count);

    // Get overdue tasks (due_date < now and not completed)
    const overdueResult = await query(
      "SELECT COUNT(*) as count FROM tasks WHERE due_date < NOW() AND status != 'completed'"
    );
    const overdueTasks = parseInt(overdueResult.rows[0].count);

    res.json({
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
