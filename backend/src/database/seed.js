import bcrypt from 'bcrypt';
import pool from '../config/database.js';

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting database seeding...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      ['Admin User', 'admin@checkdee.com', adminPassword, 'admin', 'active']
    );
    console.log('✅ Admin user created (email: admin@checkdee.com, password: admin123)');

    // Create sample team
    const teamResult = await client.query(
      `INSERT INTO teams (name, description)
       VALUES ($1, $2)
       RETURNING id`,
      ['Bangkok Team', 'Field workers operating in Bangkok area']
    );
    const teamId = teamResult.rows[0].id;
    console.log('✅ Sample team created');

    // Create manager user
    const managerPassword = await bcrypt.hash('manager123', 10);
    const managerResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role, team_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['Manager User', 'manager@checkdee.com', managerPassword, 'manager', teamId, 'active']
    );
    console.log('✅ Manager user created (email: manager@checkdee.com, password: manager123)');

    // Update team manager
    if (managerResult.rows.length > 0) {
      await client.query(
        'UPDATE teams SET manager_id = $1 WHERE id = $2',
        [managerResult.rows[0].id, teamId]
      );
    }

    // Create field worker user
    const workerPassword = await bcrypt.hash('worker123', 10);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, team_id, status, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING`,
      ['Field Worker', 'worker@checkdee.com', workerPassword, 'field_worker', teamId, 'active', '+66812345678']
    );
    console.log('✅ Field worker user created (email: worker@checkdee.com, password: worker123)');

    // Create sample task template
    await client.query(
      `INSERT INTO task_templates (name, template_data, created_by)
       VALUES ($1, $2, (SELECT id FROM users WHERE email = 'admin@checkdee.com' LIMIT 1))
       ON CONFLICT DO NOTHING`,
      [
        'Store Inspection',
        JSON.stringify({
          title: 'Monthly Store Inspection',
          description: 'Conduct monthly inspection of retail store',
          before_photos_count: 3,
          after_photos_count: 3,
          checklist: [
            { item: 'Check store cleanliness', is_critical: true },
            { item: 'Verify product displays', is_critical: true },
            { item: 'Inspect safety equipment', is_critical: true },
            { item: 'Review stock levels', is_critical: false }
          ],
          questions: [
            {
              question_text: 'Store overall condition',
              question_type: 'rating',
              required: true,
              options: { min: 1, max: 5 }
            },
            {
              question_text: 'Any issues found?',
              question_type: 'yes_no',
              required: true
            },
            {
              question_text: 'Additional comments',
              question_type: 'text',
              required: false
            }
          ]
        })
      ]
    );
    console.log('✅ Sample task template created');

    console.log('\n🎉 Database seeding completed successfully');
    console.log('\n📋 Test Credentials:');
    console.log('   Admin:   admin@checkdee.com / admin123');
    console.log('   Manager: manager@checkdee.com / manager123');
    console.log('   Worker:  worker@checkdee.com / worker123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
