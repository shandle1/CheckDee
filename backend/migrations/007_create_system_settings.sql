-- Create system_settings table for configurable platform settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  data_type VARCHAR(50) NOT NULL DEFAULT 'string', -- string, number, boolean, json
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- if true, accessible to non-admin users
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, key)
);

-- Create index for faster lookups
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_key ON system_settings(key);

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
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
  ('system', 'max_login_attempts', '5', 'number', 'Maximum failed login attempts before account lock', false);

COMMENT ON TABLE system_settings IS 'Configurable platform-wide settings managed by administrators';
