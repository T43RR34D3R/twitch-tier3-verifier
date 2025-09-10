-- =====================================================
-- COMPLETE DATABASE SETUP FOR RAILWAY
-- =====================================================

-- Create admin_users table
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
);

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create customization_settings table
CREATE TABLE IF NOT EXISTS customization_settings (
    id BIGSERIAL PRIMARY KEY,
    settings JSONB NOT NULL DEFAULT '{}',
    menu_items JSONB NOT NULL DEFAULT '[]',
    home_sections JSONB NOT NULL DEFAULT '[]',
    version INTEGER DEFAULT 1,
    updated_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create login_logs table
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
);

-- Create verification_logs table if not exists
CREATE TABLE IF NOT EXISTS verification_logs (
    id BIGSERIAL PRIMARY KEY,
    user_name TEXT NOT NULL,
    user_id TEXT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create subscribers table if not exists
CREATE TABLE IF NOT EXISTS subscribers (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    broadcaster_id TEXT NOT NULL,
    broadcaster_name TEXT NOT NULL,
    tier TEXT NOT NULL,
    is_gift BOOLEAN DEFAULT FALSE,
    gifter_id TEXT,
    gifter_name TEXT,
    plan_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create analytics_access table if not exists
CREATE TABLE IF NOT EXISTS analytics_access (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    user_name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    granted_by TEXT,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for timestamp management
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at 
  BEFORE UPDATE ON admin_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at 
  BEFORE UPDATE ON site_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customization_settings_updated_at ON customization_settings;
CREATE TRIGGER update_customization_settings_updated_at 
  BEFORE UPDATE ON customization_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscribers_updated_at ON subscribers;
CREATE TRIGGER update_subscribers_updated_at 
  BEFORE UPDATE ON subscribers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_username ON login_logs(username);
CREATE INDEX IF NOT EXISTS idx_login_logs_login_at ON login_logs(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_ip_address ON login_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_logs_is_successful ON login_logs(is_successful);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at ON verification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_logs_user_id ON verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_broadcaster_id ON subscribers(broadcaster_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_tier ON subscribers(tier);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers(created_at DESC);

-- Create chat_highlights table
CREATE TABLE IF NOT EXISTS chat_highlights (
    id BIGSERIAL PRIMARY KEY,
    message_id TEXT NOT NULL UNIQUE,
    channel TEXT NOT NULL,
    username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    color TEXT DEFAULT '#ffffff',
    badges JSONB DEFAULT '[]',
    source TEXT DEFAULT 'extension',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for chat_highlights
CREATE INDEX IF NOT EXISTS idx_chat_highlights_channel ON chat_highlights(channel);
CREATE INDEX IF NOT EXISTS idx_chat_highlights_username ON chat_highlights(username);
CREATE INDEX IF NOT EXISTS idx_chat_highlights_timestamp ON chat_highlights(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_highlights_created_at ON chat_highlights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_highlights_message_id ON chat_highlights(message_id);

-- Create update trigger for chat_highlights
DROP TRIGGER IF EXISTS update_chat_highlights_updated_at ON chat_highlights;
CREATE TRIGGER update_chat_highlights_updated_at 
  BEFORE UPDATE ON chat_highlights 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    background_color VARCHAR(7) DEFAULT '#6366f1',
    text_color VARCHAR(7) DEFAULT '#ffffff',
    is_all_day BOOLEAN DEFAULT TRUE,
    start_time TIME,
    end_time TIME,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_at ON calendar_events(created_at DESC);

-- Create update trigger for calendar_events
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at 
  BEFORE UPDATE ON calendar_events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin users
INSERT INTO admin_users (user_id, username, display_name, role, created_by)
VALUES 
  ('1239758967', 'TearReader', 'TearReader', 'super_admin', 'system'),
  ('269187200', 'BuckFoozle', 'BuckFoozle', 'super_admin', 'system')
ON CONFLICT (user_id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  is_active = true,
  updated_at = NOW();

-- Insert default customization settings if none exist
INSERT INTO customization_settings (settings, menu_items, home_sections, updated_by)
SELECT 
  '{"siteTitle":"BuckFoozle Toolkit","siteLogo":"🎮","logoType":"emoji","tagline":"Professional Streaming Tools","primaryColor":"#6366f1","secondaryColor":"#8b5cf6","accentColor":"#f59e0b","textColor":"#ffffff","surfaceColor":"#1e293b","backgroundType":"gradient","backgroundValue":"linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #1e293b 75%, #0f172a 100%)","headerStyle":"glass","showLogo":true,"logoPosition":"center","showHamburger":true,"hamburgerPosition":"left","showAuthButtons":true,"taglineAlignment":"left"}'::jsonb,
  '[{"id":"1","label":"Home","url":"/","iconType":"emoji","iconValue":"🏠","visibility":"all","isExternal":false,"openInNewTab":false,"orderIndex":1,"isEnabled":true},{"id":"2","label":"T3 Verification","url":"/t3verify","iconType":"emoji","iconValue":"👑","visibility":"all","isExternal":false,"openInNewTab":false,"orderIndex":2,"isEnabled":true},{"id":"3","label":"Subathon Timer","url":"/subathon-timer","iconType":"emoji","iconValue":"⏰","visibility":"all","isExternal":false,"openInNewTab":false,"orderIndex":3,"isEnabled":true},{"id":"4","label":"Analytics","url":"/analytics","iconType":"emoji","iconValue":"📊","visibility":"authenticated","isExternal":false,"openInNewTab":false,"orderIndex":4,"isEnabled":true},{"id":"5","label":"Admin Panel","url":"/admin","iconType":"emoji","iconValue":"⚙️","visibility":"admin","isExternal":false,"openInNewTab":false,"orderIndex":5,"isEnabled":true},{"id":"6","label":"Twitch Channel","url":"https://twitch.tv/buckfoozle","iconType":"emoji","iconValue":"💜","visibility":"all","isExternal":true,"openInNewTab":true,"orderIndex":6,"isEnabled":true}]'::jsonb,
  '[{"id":"hero","type":"hero","title":"Hero Section","isEnabled":true,"orderIndex":1,"content":{"heroTitle":"Welcome to BuckFoozle Toolkit","heroSubtitle":"Professional streaming tools for content creators","heroImage":"","heroButtons":[{"label":"Get Started","url":"/t3verify","style":"primary"},{"label":"Learn More","url":"#about","style":"secondary"}]}},{"id":"about","type":"about","title":"About Buck","isEnabled":true,"orderIndex":2,"content":{"aboutTitle":"Meet BuckFoozle","aboutText":"Professional streamer and content creator bringing you the best streaming tools and entertainment.","aboutImage":"/buckfoozle-profile.jpg","aboutImagePosition":"left"}},{"id":"twitch","type":"twitch-embed","title":"Twitch Stream","isEnabled":true,"orderIndex":3,"content":{"twitchChannel":"buckfoozle","embedType":"both"}},{"id":"tools","type":"tools","title":"Available Tools","isEnabled":true,"orderIndex":4,"content":{"toolsTitle":"Streaming Tools","showToolCards":true}}]'::jsonb,
  'system'
WHERE NOT EXISTS (SELECT 1 FROM customization_settings);

-- Show completion message
SELECT 
  'Database setup completed successfully!' as status,
  count(*) as admin_users_created
FROM admin_users;
