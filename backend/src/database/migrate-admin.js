import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrateAdmin() {
  const client = await pool.connect();

  try {
    console.log('🔄 Starting admin tables migration...');

    // Create system_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        category VARCHAR(100) NOT NULL,
        key VARCHAR(100) NOT NULL,
        value TEXT NOT NULL,
        data_type VARCHAR(50) NOT NULL DEFAULT 'string',
        description TEXT,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category, key)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_settings_updated_at'
        ) THEN
          CREATE TRIGGER update_system_settings_updated_at
            BEFORE UPDATE ON system_settings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END
      $$;
    `);

    console.log('✅ system_settings table created');

    // Create task_types table
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_types (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(50),
        color VARCHAR(50) DEFAULT '#3B82F6',
        default_priority VARCHAR(20) DEFAULT 'normal',
        default_geofence_radius INTEGER DEFAULT 100,
        default_before_photos INTEGER DEFAULT 2,
        default_after_photos INTEGER DEFAULT 2,
        requires_checklist BOOLEAN DEFAULT false,
        requires_questions BOOLEAN DEFAULT false,
        estimated_duration_minutes INTEGER,
        min_quality_score INTEGER DEFAULT 70,
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type_id UUID REFERENCES task_types(id) ON DELETE SET NULL;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_task_types_active ON task_types(is_active);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_type_id ON tasks(task_type_id);
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_task_types_updated_at'
        ) THEN
          CREATE TRIGGER update_task_types_updated_at
            BEFORE UPDATE ON task_types
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END
      $$;
    `);

    console.log('✅ task_types table created');
    console.log('✅ Admin tables migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateAdmin();
