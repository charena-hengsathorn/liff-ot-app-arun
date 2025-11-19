// Check driver table schema in database
import pg from 'pg';
const { Client } = pg;

async function checkDriverSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if drivers table exists
    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'drivers'
    `);

    if (tableCheck.rows.length === 0) {
      console.log('❌ drivers table does NOT exist!');
    } else {
      console.log('✅ drivers table exists\n');

      // Get column information
      const columnsCheck = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'drivers'
        ORDER BY ordinal_position
      `);

      console.log('📋 Columns in drivers table:');
      columnsCheck.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
    process.exit(1);
  }
}

checkDriverSchema();
