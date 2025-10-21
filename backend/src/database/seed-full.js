import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import pool from '../config/database.js';

async function seedFull() {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting comprehensive database seeding...\n');

    // Clear existing data (except schema)
    await client.query('TRUNCATE users, teams, tasks, task_checklists, task_questions, task_submissions, submission_photos, submission_checklist_items, submission_answers, task_reviews, activity_logs, notifications, task_templates RESTART IDENTITY CASCADE');
    console.log('✅ Cleared existing data\n');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role, status, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      ['Admin User', 'admin@checkdee.com', adminPassword, 'admin', 'active', '+66812345000']
    );
    const adminId = adminResult.rows[0].id;
    console.log('✅ Admin user created: admin@checkdee.com / admin123');

    // Create teams
    const teams = [
      { name: 'Bangkok Central Team', description: 'Handles all tasks in central Bangkok area' },
      { name: 'Chiang Mai Team', description: 'Northern region field operations' },
      { name: 'Phuket Team', description: 'Southern coastal region operations' },
    ];

    const teamIds = [];
    for (const team of teams) {
      const result = await client.query(
        'INSERT INTO teams (name, description) VALUES ($1, $2) RETURNING id',
        [team.name, team.description]
      );
      teamIds.push(result.rows[0].id);
    }
    console.log(`✅ Created ${teams.length} teams\n`);

    // Create managers and update teams
    const managers = [
      { name: 'Somchai Manager', email: 'somchai@checkdee.com', team_id: teamIds[0], phone: '+66812345001' },
      { name: 'Niran Manager', email: 'niran@checkdee.com', team_id: teamIds[1], phone: '+66812345002' },
      { name: 'Suda Manager', email: 'suda@checkdee.com', team_id: teamIds[2], phone: '+66812345003' },
    ];

    const managerPassword = await bcrypt.hash('manager123', 10);
    const managerIds = [];
    for (let i = 0; i < managers.length; i++) {
      const manager = managers[i];
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, role, team_id, status, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [manager.name, manager.email, managerPassword, 'manager', manager.team_id, 'active', manager.phone]
      );
      managerIds.push(result.rows[0].id);
      await client.query('UPDATE teams SET manager_id = $1 WHERE id = $2', [result.rows[0].id, manager.team_id]);
    }
    console.log(`✅ Created ${managers.length} managers (password: manager123)\n`);

    // Create field workers
    const workers = [
      { name: 'Wichai Worker', email: 'wichai@checkdee.com', team_id: teamIds[0], phone: '+66812345020' },
      { name: 'Malee Worker', email: 'malee@checkdee.com', team_id: teamIds[0], phone: '+66812345021' },
      { name: 'Preecha Worker', email: 'preecha@checkdee.com', team_id: teamIds[0], phone: '+66812345022' },
      { name: 'Siriporn Worker', email: 'siriporn@checkdee.com', team_id: teamIds[1], phone: '+66812345023' },
      { name: 'Kanya Worker', email: 'kanya@checkdee.com', team_id: teamIds[1], phone: '+66812345024' },
      { name: 'Boonmee Worker', email: 'boonmee@checkdee.com', team_id: teamIds[2], phone: '+66812345025' },
    ];

    const workerPassword = await bcrypt.hash('worker123', 10);
    const workerIds = [];
    for (const worker of workers) {
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, role, team_id, status, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [worker.name, worker.email, workerPassword, 'field_worker', worker.team_id, 'active', worker.phone]
      );
      workerIds.push(result.rows[0].id);
    }
    console.log(`✅ Created ${workers.length} field workers (password: worker123)\n`);

    // Create tasks with real locations
    const now = new Date();
    const tasks = [
      {
        title: 'Store Inspection - Central World',
        description: 'Monthly inspection of retail store at Central World. Check inventory, cleanliness, displays.',
        location_address: 'Central World, Pathum Wan, Bangkok',
        lat: 13.7469, lng: 100.5398,
        assigned: workerIds[0], days: 2, priority: 'high', status: 'assigned', created: managerIds[0]
      },
      {
        title: 'Product Delivery - Siam Paragon',
        description: 'Deliver promotional materials. Ensure proper placement and documentation.',
        location_address: 'Siam Paragon, Pathum Wan, Bangkok',
        lat: 13.7465, lng: 100.5347,
        assigned: workerIds[1], days: 1, priority: 'urgent', status: 'in_progress', created: managerIds[0]
      },
      {
        title: 'Customer Survey - MBK Center',
        description: 'Conduct satisfaction survey. Target 20 respondents.',
        location_address: 'MBK Center, Bangkok',
        lat: 13.7443, lng: 100.5302,
        assigned: workerIds[2], days: 3, priority: 'normal', status: 'assigned', created: managerIds[0]
      },
      {
        title: 'Equipment Check - Chiang Mai Airport',
        description: 'Inspect and verify all equipment. Report damages or missing items.',
        location_address: 'Chiang Mai Airport',
        lat: 18.7714, lng: 98.9626,
        assigned: workerIds[3], days: 4, priority: 'high', status: 'assigned', created: managerIds[1]
      },
      {
        title: 'Beach Resort Inspection - Patong',
        description: 'Quality inspection of resort facilities. Check all amenities.',
        location_address: 'Patong Beach, Phuket',
        lat: 7.8964, lng: 98.2964,
        assigned: workerIds[5], days: 7, priority: 'high', status: 'assigned', created: managerIds[2]
      },
    ];

    const taskIds = [];
    for (const task of tasks) {
      const dueDate = new Date(now.getTime() + task.days * 24 * 60 * 60 * 1000);
      const result = await client.query(
        `INSERT INTO tasks (
          title, description, location_address, location_latitude, location_longitude,
          geofence_radius, assigned_to, due_date, priority, status, created_by,
          before_photos_count, after_photos_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id`,
        [task.title, task.description, task.location_address, task.lat, task.lng,
         100, task.assigned, dueDate, task.priority, task.status, task.created, 2, 2]
      );
      taskIds.push(result.rows[0].id);
    }
    console.log(`✅ Created ${tasks.length} tasks with real Bangkok/Chiang Mai/Phuket locations\n`);

    // Add checklists
    const checklists = [
      ['Verify store cleanliness', 'Check displays', 'Inspect safety equipment'],
      ['Confirm delivery', 'Document placement', 'Get signature'],
      ['Prepare materials', 'Approach customers', 'Record responses'],
    ];

    for (let i = 0; i < Math.min(taskIds.length, checklists.length); i++) {
      for (let j = 0; j < checklists[i].length; j++) {
        await client.query(
          'INSERT INTO task_checklists (task_id, item, is_critical, "order") VALUES ($1, $2, $3, $4)',
          [taskIds[i], checklists[i][j], j === 0, j]
        );
      }
    }
    console.log('✅ Added checklist items\n');

    console.log('\n🎉 Database seeding completed!\n');
    console.log('═══════════════════════════════════════');
    console.log('📋 TEST ACCOUNTS:');
    console.log('═══════════════════════════════════════');
    console.log('👨‍💼 Admin:    admin@checkdee.com / admin123');
    console.log('👔 Managers:  somchai@checkdee.com / manager123');
    console.log('             niran@checkdee.com / manager123');
    console.log('             suda@checkdee.com / manager123');
    console.log('🚶 Workers:   wichai@checkdee.com / worker123');
    console.log('             malee@checkdee.com / worker123');
    console.log('             (+ 4 more workers)');
    console.log('═══════════════════════════════════════');
    console.log(`📊 ${teams.length} Teams | ${managers.length} Managers | ${workers.length} Workers | ${tasks.length} Tasks`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedFull();
