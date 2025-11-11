import pool from '../config/database.js';

async function seedSettings() {
  const client = await pool.connect();

  try {
    console.log('🌱 Seeding system settings...');

    // Insert default settings (only if they don't exist)
    await client.query(`
      INSERT INTO system_settings (category, key, value, data_type, description, is_public) VALUES
        -- Geofencing settings
        ('geofencing', 'default_radius_meters', '100', 'number', 'Default geofence radius in meters for task check-ins', false),
        ('geofencing', 'strict_validation', 'true', 'boolean', 'Enforce strict GPS validation for task check-ins', false),
        ('geofencing', 'accuracy_threshold_meters', '50', 'number', 'Maximum acceptable GPS accuracy in meters', false),

        -- Photo settings
        ('photos', 'before_photos_required', '2', 'number', 'Number of before photos required per task', false),
        ('photos', 'after_photos_required', '2', 'number', 'Number of after photos required per task', false),
        ('photos', 'max_file_size_mb', '5', 'number', 'Maximum file size for photo uploads in MB', false),
        ('photos', 'allowed_formats', '["jpeg", "jpg", "png"]', 'json', 'Allowed photo file formats', false),
        ('photos', 'require_captions', 'false', 'boolean', 'Require captions for all uploaded photos', false),

        -- Task settings
        ('tasks', 'default_priority', 'normal', 'string', 'Default priority for new tasks (low, normal, high, urgent)', false),
        ('tasks', 'auto_assign_team_leader', 'false', 'boolean', 'Automatically assign tasks to team leader for review', false),
        ('tasks', 'allow_worker_create', 'false', 'boolean', 'Allow field workers to create their own tasks', false),
        ('tasks', 'require_completion_notes', 'false', 'boolean', 'Require notes when completing tasks', false),

        -- Submission settings
        ('submissions', 'default_approval_workflow', 'manager', 'string', 'Default approval workflow (manager, team_leader, admin)', false),
        ('submissions', 'auto_approve_threshold', '0', 'number', 'Auto-approve submissions with quality score above this (0 = disabled)', false),
        ('submissions', 'require_review_notes', 'true', 'boolean', 'Require notes when rejecting submissions', false),
        ('submissions', 'max_revision_requests', '3', 'number', 'Maximum number of revision requests per submission', false),

        -- Quality settings
        ('quality', 'enable_quality_scoring', 'true', 'boolean', 'Enable quality scoring for submissions', false),
        ('quality', 'min_quality_score', '70', 'number', 'Minimum acceptable quality score (0-100)', false),
        ('quality', 'photo_quality_weight', '40', 'number', 'Weight of photo quality in overall score (percentage)', false),
        ('quality', 'checklist_weight', '30', 'number', 'Weight of checklist completion in overall score (percentage)', false),
        ('quality', 'question_weight', '30', 'number', 'Weight of question answers in overall score (percentage)', false),

        -- Notification settings
        ('notifications', 'enable_line_notifications', 'true', 'boolean', 'Enable LINE notifications for users', true),
        ('notifications', 'task_assignment_notify', 'true', 'boolean', 'Notify workers when tasks are assigned', false),
        ('notifications', 'submission_review_notify', 'true', 'boolean', 'Notify workers when submissions are reviewed', false),
        ('notifications', 'task_reminder_hours', '24', 'number', 'Hours before due date to send reminder (0 = disabled)', false),
        ('notifications', 'overdue_reminder_hours', '24', 'number', 'Hours interval for overdue task reminders (0 = disabled)', false),

        -- System settings
        ('system', 'platform_name', 'CheckDee', 'string', 'Platform display name', true),
        ('system', 'maintenance_mode', 'false', 'boolean', 'Enable maintenance mode (blocks non-admin access)', false),
        ('system', 'session_timeout_minutes', '60', 'number', 'Inactive session timeout in minutes', false),
        ('system', 'max_login_attempts', '5', 'number', 'Maximum failed login attempts before account lock', false)
      ON CONFLICT (category, key) DO NOTHING
    `);

    // Seed default task types
    await client.query(`
      INSERT INTO task_types (name, description, icon, color, default_priority, estimated_duration_minutes) VALUES
        ('Inspection', 'Regular inspection tasks requiring photos and checklists', 'ClipboardCheck', '#3B82F6', 'normal', 30),
        ('Maintenance', 'Routine maintenance and repair tasks', 'Wrench', '#F59E0B', 'normal', 60),
        ('Delivery', 'Package or equipment delivery tasks', 'Package', '#10B981', 'normal', 45),
        ('Installation', 'Equipment or system installation tasks', 'Settings', '#8B5CF6', 'high', 120),
        ('Survey', 'Data collection and survey tasks', 'FileText', '#06B6D4', 'normal', 30),
        ('Emergency', 'Urgent emergency response tasks', 'AlertCircle', '#EF4444', 'urgent', 15),
        ('Cleanup', 'Cleaning and cleanup tasks', 'Trash2', '#6B7280', 'low', 45),
        ('Documentation', 'Documentation and record-keeping tasks', 'FileCheck', '#64748B', 'low', 20)
      ON CONFLICT (name) DO NOTHING
    `);

    console.log('✅ System settings and task types seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedSettings();
