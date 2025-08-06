const { Pool } = require('pg');

// Railway PostgreSQL connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:SxOjBzueLMCQPjSeBWBCSfSHQauQKVtC@shortline.proxy.rlwy.net:36004/railway',
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function updatePageSettings() {
  console.log('🚀 Updating page_settings table for enhanced redirects...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Railway PostgreSQL successfully!');
    
    // Add new columns for redirect options
    console.log('📦 Adding redirect columns...');
    await client.query(`
      ALTER TABLE page_settings 
      ADD COLUMN IF NOT EXISTS redirect_url_1 TEXT,
      ADD COLUMN IF NOT EXISTS redirect_url_2 TEXT,
      ADD COLUMN IF NOT EXISTS redirect_label_1 VARCHAR(100) DEFAULT 'Submit Form',
      ADD COLUMN IF NOT EXISTS redirect_label_2 VARCHAR(100) DEFAULT 'Alternative',
      ADD COLUMN IF NOT EXISTS enable_dual_choice BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS success_message TEXT DEFAULT 'Tier 3 subscription verified! Choose your next step:';
    `);
    
    // Update existing settings with current Notion URL
    console.log('📝 Updating existing settings...');
    await client.query(`
      UPDATE page_settings 
      SET 
        redirect_url_1 = $1,
        redirect_label_1 = 'Submit T3 Form',
        success_message = 'Tier 3 subscription verified! You can now submit your custom T3 form.'
      WHERE redirect_url_1 IS NULL;
    `, ['https://expensive-battery-1ef.notion.site/22baab23c4af80a5b93a8de32f464a191?pvs=105']);
    
    console.log('🎉 Page settings updated successfully!');
    
    // Show current settings
    const result = await client.query('SELECT * FROM page_settings LIMIT 1');
    console.log('📊 Current settings:', result.rows[0]);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database update failed:', error.message);
  } finally {
    await pool.end();
  }
}

updatePageSettings().catch(console.error);
