import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Starting task schema migration...');

    await client.query('BEGIN');

    // 1. Make assigned_to nullable
    console.log('Making assigned_to nullable...');
    await client.query(`
      ALTER TABLE tasks
      ALTER COLUMN assigned_to DROP NOT NULL;
    `);

    // 2. Drop the old priority constraint FIRST so we can update data
    console.log('Dropping old priority constraint...');
    await client.query(`
      ALTER TABLE tasks
      DROP CONSTRAINT IF EXISTS tasks_priority_check;
    `);

    // 3. Update existing 'normal' priority tasks to 'medium'
    console.log('Updating existing normal priority tasks to medium...');
    await client.query(`
      UPDATE tasks
      SET priority = 'medium'
      WHERE priority = 'normal';
    `);

    // 4. Add new priority constraint with 'medium' instead of 'normal'
    console.log('Adding new priority constraint...');
    await client.query(`
      ALTER TABLE tasks
      ADD CONSTRAINT tasks_priority_check
      CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
    `);

    // 5. Update the default value for priority
    console.log('Updating default priority value...');
    await client.query(`
      ALTER TABLE tasks
      ALTER COLUMN priority SET DEFAULT 'medium';
    `);

    await client.query('COMMIT');

    console.log('✅ Task schema migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
