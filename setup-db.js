const { Pool } = require('pg');
const fs = require('fs');

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔗 Connecting to database...');
    
    // Read the SQL file
    const sql = fs.readFileSync('./setup-database.sql', 'utf8');
    
    console.log('📝 Executing database setup...');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Database setup completed successfully!');
    
    // Check what tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check admin users
    const adminResult = await pool.query('SELECT username, role FROM admin_users ORDER BY created_at');
    console.log('\n👨‍💼 Admin users configured:');
    adminResult.rows.forEach(row => {
      console.log(`  - ${row.username} (${row.role})`);
    });
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
