import pool from '../config/database.js';

async function migrateAnalytics() {
  const client = await pool.connect();

  try {
    console.log('🔄 Starting analytics schema migration...');

    // Add quality_score and completion_time to task_submissions
    await client.query(`
      ALTER TABLE task_submissions
      ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
      ADD COLUMN IF NOT EXISTS completion_time INTEGER; -- in minutes
    `);

    console.log('✅ Added quality_score and completion_time columns');

    // Create analytics views for performance
    await client.query(`
      CREATE OR REPLACE VIEW worker_performance_stats AS
      SELECT
        u.id as worker_id,
        u.name as worker_name,
        u.team_id,
        t.name as team_name,
        COUNT(DISTINCT ts.id) as total_submissions,
        COUNT(DISTINCT CASE WHEN ts.status = 'approved' THEN ts.id END) as approved_count,
        COUNT(DISTINCT CASE WHEN ts.status = 'rejected' THEN ts.id END) as rejected_count,
        COUNT(DISTINCT CASE WHEN ts.status = 'pending' THEN ts.id END) as pending_count,
        ROUND(AVG(ts.quality_score), 2) as avg_quality_score,
        ROUND(AVG(ts.completion_time), 2) as avg_completion_time,
        COUNT(DISTINCT CASE WHEN ts.status = 'approved' THEN ts.id END)::float /
          NULLIF(COUNT(DISTINCT ts.id), 0) * 100 as approval_rate
      FROM users u
      LEFT JOIN teams t ON u.team_id = t.id
      LEFT JOIN task_submissions ts ON u.id = ts.worker_id
      WHERE u.role = 'field_worker'
      GROUP BY u.id, u.name, u.team_id, t.name;
    `);

    console.log('✅ Created worker_performance_stats view');

    // Create team performance view
    await client.query(`
      CREATE OR REPLACE VIEW team_performance_stats AS
      SELECT
        t.id as team_id,
        t.name as team_name,
        t.manager_id,
        m.name as manager_name,
        COUNT(DISTINCT u.id) as member_count,
        COUNT(DISTINCT ts.id) as total_submissions,
        COUNT(DISTINCT CASE WHEN ts.status = 'approved' THEN ts.id END) as approved_count,
        ROUND(AVG(ts.quality_score), 2) as avg_quality_score,
        ROUND(AVG(ts.completion_time), 2) as avg_completion_time,
        COUNT(DISTINCT task.id) as total_tasks_assigned,
        COUNT(DISTINCT CASE WHEN task.status = 'completed' THEN task.id END) as completed_tasks,
        COUNT(DISTINCT CASE WHEN task.due_date < CURRENT_TIMESTAMP AND task.status != 'completed' THEN task.id END) as overdue_tasks
      FROM teams t
      LEFT JOIN users m ON t.manager_id = m.id
      LEFT JOIN users u ON t.id = u.team_id AND u.role = 'field_worker'
      LEFT JOIN task_submissions ts ON u.id = ts.worker_id
      LEFT JOIN tasks task ON u.id = task.assigned_to
      GROUP BY t.id, t.name, t.manager_id, m.name;
    `);

    console.log('✅ Created team_performance_stats view');

    // Create task type statistics view
    await client.query(`
      CREATE OR REPLACE VIEW task_type_stats AS
      SELECT
        tt.id as type_id,
        tt.name as type_name,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
        COUNT(DISTINCT ts.id) as total_submissions,
        ROUND(AVG(ts.quality_score), 2) as avg_quality_score,
        ROUND(AVG(ts.completion_time), 2) as avg_completion_time,
        ROUND(AVG(EXTRACT(EPOCH FROM (ts.submitted_at - t.created_at))/60), 2) as avg_time_to_submit
      FROM task_types tt
      LEFT JOIN tasks t ON tt.id = t.task_type_id
      LEFT JOIN task_submissions ts ON t.id = ts.task_id
      GROUP BY tt.id, tt.name;
    `);

    console.log('✅ Created task_type_stats view');

    console.log('✅ Analytics schema migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateAnalytics();
