const { Pool } = require('pg');

// Railway PostgreSQL connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:SxOjBzueLMCQPjSeBWBCSfSHQauQKVtC@shortline.proxy.rlwy.net:36004/railway',
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function createPageSettings() {
  console.log('🚀 Creating enhanced page_settings table...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Railway PostgreSQL successfully!');
    
    // Create page_settings table with enhanced redirect options
    console.log('📦 Creating page_settings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS page_settings (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL DEFAULT 'Tier 3 Verification & Subathon Voting',
        subtitle TEXT NOT NULL DEFAULT 'Verify your Tier 3 subscription and vote for games to play during the subathon!',
        sign_in_text TEXT NOT NULL DEFAULT 'Please sign in with your Twitch account to verify your subscription status and participate in voting.',
        steps JSONB NOT NULL DEFAULT '["Signed In", "Checking Follow", "Checking Tier 3", "Voting Enabled", "Verified"]'::jsonb,
        
        -- Enhanced redirect system
        redirect_url_1 TEXT,
        redirect_url_2 TEXT,
        redirect_label_1 VARCHAR(100) DEFAULT 'Submit Form',
        redirect_label_2 VARCHAR(100) DEFAULT 'Alternative',
        enable_dual_choice BOOLEAN DEFAULT false,
        success_message TEXT DEFAULT 'Tier 3 subscription verified! Choose your next step:',
        
        -- Timestamps
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create update trigger
    console.log('⚙️ Creating update trigger...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      CREATE TRIGGER update_page_settings_updated_at 
        BEFORE UPDATE ON page_settings 
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    `);
    
    // Insert initial settings
    console.log('📝 Inserting initial settings...');
    await client.query(`
      INSERT INTO page_settings (
        title, 
        subtitle, 
        sign_in_text, 
        steps,
        redirect_url_1,
        redirect_label_1,
        success_message,
        enable_dual_choice
      ) VALUES (
        'BuckFoozle T3 Toolkit',
        'Verify your Tier 3 subscription to submit info for your custom T3 cheer!',
        'Please sign in with your Twitch account to verify your subscription status.',
        '["Signed In", "Checking Follow", "Checking Tier 3", "Verified"]'::jsonb,
        $1,
        'Submit T3 Form',
        'Tier 3 subscription verified! You can now submit your custom T3 form.',
        false
      ) ON CONFLICT DO NOTHING;
    `, ['https://expensive-battery-1ef.notion.site/22baab23c4af80a5b93a8de32f464a191?pvs=105']);
    
    console.log('🎉 Page settings table created successfully!');
    
    // Show current settings
    const result = await client.query('SELECT * FROM page_settings LIMIT 1');
    console.log('📊 Current settings:', result.rows[0]);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database creation failed:', error.message);
  } finally {
    await pool.end();
  }
}

createPageSettings().catch(console.error);
