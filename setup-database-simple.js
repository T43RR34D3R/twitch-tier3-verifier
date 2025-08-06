const { Pool } = require('pg');

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
    const client = await pool.connect();
    console.log('✅ Connected to Railway PostgreSQL successfully!');
    
    // Create just the essential subathon_timer table first
    console.log('📦 Creating subathon_timer table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS subathon_timer (
        id SERIAL PRIMARY KEY,
        end_time BIGINT DEFAULT 0,
        is_running BOOLEAN DEFAULT false,
        status TEXT DEFAULT 'Timer Ready - Set time to begin!',
        pending_duration INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Insert initial data
    console.log('📝 Inserting initial timer data...');
    await client.query(`
      INSERT INTO subathon_timer (end_time, is_running, status, pending_duration) 
      VALUES (0, false, 'Timer Ready - Set time to begin!', 0)
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('🎉 Essential database setup completed!');
    
    // Test the table
    const result = await client.query('SELECT * FROM subathon_timer LIMIT 1');
    console.log('✅ Timer table created and tested:', result.rows[0]);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
  } finally {
    await pool.end();
  }
}

setupDatabase().catch(console.error);
