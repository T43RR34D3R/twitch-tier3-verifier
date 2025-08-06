const { Pool } = require('pg');
const fs = require('fs');

// Railway PostgreSQL connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:SxOjBzueLMCQPjSeBWBCSfSHQauQKVtC@shortline.proxy.rlwy.net:36004/railway',
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function setupDatabase() {
  console.log('🚀 Starting Railway database setup...');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to Railway PostgreSQL successfully!');
    
    // Read SQL file
    const sqlScript = fs.readFileSync('./railway-database-setup.sql', 'utf8');
    
    // Execute the entire script
    console.log('📦 Creating tables and indexes...');
    await client.query(sqlScript);
    
    console.log('🎉 Database setup completed successfully!');
    console.log('📊 All tables created with voting system ready!');
    
    client.release();
    
    // Test the timer table
    console.log('🔍 Testing subathon_timer table...');
    const result = await pool.query('SELECT COUNT(*) FROM subathon_timer');
    console.log(`✅ Timer table has ${result.rows[0].count} records`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
    console.log('🔐 Database connection closed');
  }
}

// Run setup
setupDatabase().catch(console.error);
