import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const { Pool } = pg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Running LINE fields migration...');

    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', '002_add_line_fields.sql'),
      'utf8'
    );

    await client.query(migrationSQL);

    console.log('✅ LINE fields migration completed successfully');
    console.log('  - Added line_display_name column');
    console.log('  - Added line_picture_url column');
    console.log('  - Added linked_at column');
    console.log('  - Created user_invite_tokens table');
    console.log('  - Created necessary indexes');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
