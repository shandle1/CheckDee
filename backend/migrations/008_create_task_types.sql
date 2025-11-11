-- Create task_types table for task categorization with default settings
CREATE TABLE IF NOT EXISTS task_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50), -- icon name for UI display
  color VARCHAR(50) DEFAULT '#3B82F6', -- hex color for UI

  -- Default settings for tasks of this type
  default_priority VARCHAR(20) DEFAULT 'normal',
  default_geofence_radius INTEGER DEFAULT 100,
  default_before_photos INTEGER DEFAULT 2,
  default_after_photos INTEGER DEFAULT 2,
  requires_checklist BOOLEAN DEFAULT false,
  requires_questions BOOLEAN DEFAULT false,

  -- Time estimates
  estimated_duration_minutes INTEGER, -- estimated time to complete

  -- Quality settings
  min_quality_score INTEGER DEFAULT 70,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add task_type_id to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type_id UUID REFERENCES task_types(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_task_types_active ON task_types(is_active);
CREATE INDEX idx_tasks_type_id ON tasks(task_type_id);

-- Create trigger for updated_at
CREATE TRIGGER update_task_types_updated_at
  BEFORE UPDATE ON task_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default task types
INSERT INTO task_types (name, description, icon, color, default_priority, estimated_duration_minutes) VALUES
  ('Inspection', 'Regular inspection tasks requiring photos and checklists', 'ClipboardCheck', '#3B82F6', 'normal', 30),
  ('Maintenance', 'Routine maintenance and repair tasks', 'Wrench', '#F59E0B', 'normal', 60),
  ('Delivery', 'Package or equipment delivery tasks', 'Package', '#10B981', 'normal', 45),
  ('Installation', 'Equipment or system installation tasks', 'Settings', '#8B5CF6', 'high', 120),
  ('Survey', 'Data collection and survey tasks', 'FileText', '#06B6D4', 'normal', 30),
  ('Emergency', 'Urgent emergency response tasks', 'AlertCircle', '#EF4444', 'urgent', 15),
  ('Cleanup', 'Cleaning and cleanup tasks', 'Trash2', '#6B7280', 'low', 45),
  ('Documentation', 'Documentation and record-keeping tasks', 'FileCheck', '#64748B', 'low', 20);

COMMENT ON TABLE task_types IS 'Task type definitions with default settings and configurations';
COMMENT ON COLUMN tasks.task_type_id IS 'Reference to task type for applying default settings';
