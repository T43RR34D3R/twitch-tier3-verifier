import { NextResponse } from 'next/server';
import { query } from '@/lib/railway-db';

export async function POST() {
  try {
    console.log('🔧 Starting database initialization...');

    // Create admin_users table
    await query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        username VARCHAR(100) NOT NULL,
        display_name VARCHAR(100),
        email TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        role VARCHAR(50) DEFAULT 'admin',
        created_by TEXT,
        granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Create customization_settings table
    await query(`
      CREATE TABLE IF NOT EXISTS customization_settings (
        id BIGSERIAL PRIMARY KEY,
        settings JSONB NOT NULL DEFAULT '{}',
        menu_items JSONB NOT NULL DEFAULT '[]',
        home_sections JSONB NOT NULL DEFAULT '[]',
        version INTEGER DEFAULT 1,
        updated_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Create login_logs table
    await query(`
      CREATE TABLE IF NOT EXISTS login_logs (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        username VARCHAR(100) NOT NULL,
        display_name VARCHAR(100),
        email TEXT,
        ip_address INET,
        user_agent TEXT,
        login_method VARCHAR(50) DEFAULT 'twitch',
        session_token TEXT,
        access_token_expires_at TIMESTAMP WITH TIME ZONE,
        is_successful BOOLEAN DEFAULT TRUE,
        failure_reason TEXT,
        login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Create update trigger function
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Create triggers
    await query(`DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users`);
    await query(`
      CREATE TRIGGER update_admin_users_updated_at 
        BEFORE UPDATE ON admin_users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await query(`DROP TRIGGER IF EXISTS update_customization_settings_updated_at ON customization_settings`);
    await query(`
      CREATE TRIGGER update_customization_settings_updated_at 
        BEFORE UPDATE ON customization_settings 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_login_logs_login_at ON login_logs(login_at DESC)`);

    // Insert default admin users
    await query(`
      INSERT INTO admin_users (user_id, username, display_name, role, created_by)
      VALUES 
        ('1239758967', 'TearReader', 'TearReader', 'super_admin', 'system'),
        ('269187200', 'BuckFoozle', 'BuckFoozle', 'super_admin', 'system')
      ON CONFLICT (user_id) DO UPDATE SET
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        role = EXCLUDED.role,
        is_active = true,
        updated_at = NOW()
    `);

    // Insert default customization settings
    await query(`
      INSERT INTO customization_settings (settings, menu_items, home_sections, updated_by)
      SELECT 
        '{"siteTitle":"BuckFoozle Toolkit","siteLogo":"🎮","logoType":"emoji","tagline":"Professional Streaming Tools","primaryColor":"#6366f1","secondaryColor":"#8b5cf6","accentColor":"#f59e0b","textColor":"#ffffff","surfaceColor":"#1e293b","backgroundType":"gradient","backgroundValue":"linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #1e293b 75%, #0f172a 100%)","headerStyle":"glass","showLogo":true,"logoPosition":"center","showHamburger":true,"hamburgerPosition":"left","showAuthButtons":true,"taglineAlignment":"left"}'::jsonb,
        '[{"id":"1","label":"Home","url":"/","iconType":"emoji","iconValue":"🏠","visibility":"all","isExternal":false,"openInNewTab":false,"orderIndex":1,"isEnabled":true},{"id":"2","label":"T3 Verification","url":"/t3verify","iconType":"emoji","iconValue":"👑","visibility":"all","isExternal":false,"openInNewTab":false,"orderIndex":2,"isEnabled":true},{"id":"3","label":"Subathon Timer","url":"/subathon-timer","iconType":"emoji","iconValue":"⏰","visibility":"all","isExternal":false,"openInNewTab":false,"orderIndex":3,"isEnabled":true},{"id":"4","label":"Analytics","url":"/analytics","iconType":"emoji","iconValue":"📊","visibility":"authenticated","isExternal":false,"openInNewTab":false,"orderIndex":4,"isEnabled":true},{"id":"5","label":"Admin Panel","url":"/admin","iconType":"emoji","iconValue":"⚙️","visibility":"admin","isExternal":false,"openInNewTab":false,"orderIndex":5,"isEnabled":true},{"id":"6","label":"Twitch Channel","url":"https://twitch.tv/buckfoozle","iconType":"emoji","iconValue":"💜","visibility":"all","isExternal":true,"openInNewTab":true,"orderIndex":6,"isEnabled":true}]'::jsonb,
        '[{"id":"hero","type":"hero","title":"Hero Section","isEnabled":true,"orderIndex":1,"content":{"heroTitle":"Welcome to BuckFoozle Toolkit","heroSubtitle":"Professional streaming tools for content creators","heroImage":"","heroButtons":[{"label":"Get Started","url":"/t3verify","style":"primary"},{"label":"Learn More","url":"#about","style":"secondary"}]}},{"id":"about","type":"about","title":"About Buck","isEnabled":true,"orderIndex":2,"content":{"aboutTitle":"Meet BuckFoozle","aboutText":"Professional streamer and content creator bringing you the best streaming tools and entertainment.","aboutImage":"/buckfoozle-profile.jpg","aboutImagePosition":"left"}},{"id":"twitch","type":"twitch-embed","title":"Twitch Stream","isEnabled":true,"orderIndex":3,"content":{"twitchChannel":"buckfoozle","embedType":"both"}},{"id":"tools","type":"tools","title":"Available Tools","isEnabled":true,"orderIndex":4,"content":{"toolsTitle":"Streaming Tools","showToolCards":true}}]'::jsonb,
        'system'
      WHERE NOT EXISTS (SELECT 1 FROM customization_settings)
    `);

    // Get list of tables
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    // Get admin users
    const adminResult = await query('SELECT username, role, is_active FROM admin_users ORDER BY created_at');

    console.log('✅ Database initialized successfully!');
    
    return NextResponse.json({
      success: true,
      message: "Database initialized successfully!",
      tables: tablesResult.rows.map(r => r.table_name),
      adminUsers: adminResult.rows
    });

  } catch (error) {
    console.error('❌ Database init failed:', error);
    return NextResponse.json(
      { error: 'Database initialization failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
