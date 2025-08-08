const { Pool } = require('pg');
require('dotenv').config({ path: ['.env.local', '.env'] });

// Railway PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Helper function for queries
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function clearVerificationLogs() {
  try {
    console.log('Clearing verification logs table...');

    // Get count before clearing
    const countBeforeResult = await query('SELECT COUNT(*) as count FROM verification_logs');
    const countBefore = countBeforeResult.rows[0]?.count || 0;
    console.log(`Found ${countBefore} verification log entries`);

    if (countBefore === 0) {
      console.log('No verification logs to clear.');
      pool.end();
      return;
    }

    // Clear all verification logs
    await query('DELETE FROM verification_logs');
    
    // Reset the auto-increment sequence
    await query('ALTER SEQUENCE verification_logs_id_seq RESTART WITH 1');

    console.log(`✅ Successfully cleared ${countBefore} verification log entries`);
    console.log('✅ Reset auto-increment sequence to start from 1');

  } catch (error) {
    console.error('❌ Error clearing verification logs:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

clearVerificationLogs();
