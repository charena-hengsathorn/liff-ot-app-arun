// Create a user directly in the database
// Usage: node create-user.js <username> <email> <password>

import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

async function createUser() {
  const username = process.argv[2] || 'testdriver';
  const email = process.argv[3] || 'testdriver@example.com';
  const password = process.argv[4] || 'Test123!';

  console.log(`Creating user: ${username} (${email})`);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if user already exists
    const checkUser = await client.query(
      'SELECT id FROM up_users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (checkUser.rows.length > 0) {
      console.log('❌ User already exists!');
      await client.end();
      process.exit(1);
    }

    // Hash password (Strapi uses bcrypt with 10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('🔐 Password hashed');

    // Get the "Authenticated" role ID (usually 1)
    const roleResult = await client.query(
      "SELECT id FROM up_roles WHERE type = 'authenticated' LIMIT 1"
    );
    const roleId = roleResult.rows[0]?.id || 1;

    // Insert user
    const result = await client.query(
      `INSERT INTO up_users (username, email, password, confirmed, blocked, role, provider, created_at, updated_at, created_by_id, updated_by_id)
       VALUES ($1, $2, $3, true, false, $4, 'local', NOW(), NOW(), 1, 1)
       RETURNING id, username, email`,
      [username, email, hashedPassword, roleId]
    );

    console.log('✅ User created successfully!');
    console.log('📋 User details:', result.rows[0]);
    console.log('\n🔑 Login credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🌐 Test login at:');
    console.log('   POST https://liff-ot-app-arun-d0ff4972332c.herokuapp.com/login');

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
    process.exit(1);
  }
}

createUser();
