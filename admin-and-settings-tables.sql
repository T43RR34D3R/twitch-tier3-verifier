-- =====================================================
-- ADMIN USERS AND SITE SETTINGS TABLES
-- =====================================================
-- Run this in Railway PostgreSQL console

-- Create admin_users table for secure admin access
CREATE TABLE IF NOT EXISTS admin_users (
    id BIGSERIAL PRIMARY KEY,
    
    -- User identification
    user_id TEXT NOT NULL UNIQUE,  -- Twitch user ID
    username VARCHAR(100) NOT NULL, -- Twitch username
    display_name VARCHAR(100),      -- Twitch display name
    email TEXT,
    
    -- Admin permissions
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(50) DEFAULT 'admin', -- admin, super_admin
    
    -- Access tracking
    created_by TEXT,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create site_settings table to persist settings
CREATE TABLE IF NOT EXISTS site_settings (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    
    -- Metadata
    updated_by TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create customization_settings table for UI customization
CREATE TABLE IF NOT EXISTS customization_settings (
    id BIGSERIAL PRIMARY KEY,
    
    -- Settings data
    settings JSONB NOT NULL DEFAULT '{}',
    menu_items JSONB NOT NULL DEFAULT '[]',
    home_sections JSONB NOT NULL DEFAULT '[]',
    
    -- Version tracking
    version INTEGER DEFAULT 1,
    
    -- Metadata
    updated_by TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create update trigger for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for timestamp management
CREATE TRIGGER update_admin_users_updated_at 
  BEFORE UPDATE ON admin_users 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at 
  BEFORE UPDATE ON site_settings 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_customization_settings_updated_at 
  BEFORE UPDATE ON customization_settings 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Insert default admin users (replace with your actual user IDs)
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

-- Insert default customization settings
INSERT INTO customization_settings (settings, menu_items, home_sections, updated_by)
SELECT 
    '{"siteTitle":"BuckFoozle Toolkit","siteLogo":"🎮","logoType":"emoji","tagline":"Professional Streaming Tools","primaryColor":"#6366f1","secondaryColor":"#8b5cf6","accentColor":"#f59e0b","textColor":"#ffffff","surfaceColor":"#1e293b","backgroundType":"gradient","backgroundValue":"linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #1e293b 75%, #0f172a 100%)","headerStyle":"glass","showLogo":true,"logoPosition":"center","showHamburger":true,"hamburgerPosition":"left","showAuthButtons":true,"taglineAlignment":"left"}'::jsonb,
    '[{"id":"1","label":"Home","url":"/","iconType":"emoji","iconValue":"🏠","visibility":"all","isExternal":false,"openInNewTab":false,"orderIndex":1,"isEnabled":true},{"id":"2","label":"T3 Verification","url":"/t3verify","iconType":"emoji","iconValue":"👑","visibility":"all","isExternal":false,"openInNewTab":false,"orderIndex":2,"isEnabled":true},{"id":"3","label":"Subathon Timer","url":"/subathon-timer","iconType":"emoji","iconValue":"⏰","visibility":"all","isExternal":false,"openInNewTab":false,"orderIndex":3,"isEnabled":true},{"id":"4","label":"Analytics","url":"/analytics","iconType":"emoji","iconValue":"📊","visibility":"authenticated","isExternal":false,"openInNewTab":false,"orderIndex":4,"isEnabled":true},{"id":"5","label":"Admin Panel","url":"/admin","iconType":"emoji","iconValue":"⚙️","visibility":"admin","isExternal":false,"openInNewTab":false,"orderIndex":5,"isEnabled":true},{"id":"6","label":"Twitch Channel","url":"https://twitch.tv/buckfoozle","iconType":"emoji","iconValue":"💜","visibility":"all","isExternal":true,"openInNewTab":true,"orderIndex":6,"isEnabled":true}]'::jsonb,
    '[{"id":"hero","type":"hero","title":"Hero Section","isEnabled":true,"orderIndex":1,"content":{"heroTitle":"Welcome to BuckFoozle Toolkit","heroSubtitle":"Professional streaming tools for content creators","heroImage":"","heroButtons":[{"label":"Get Started","url":"/t3verify","style":"primary"},{"label":"Learn More","url":"#about","style":"secondary"}]}},{"id":"about","type":"about","title":"About Buck","isEnabled":true,"orderIndex":2,"content":{"aboutTitle":"Meet BuckFoozle","aboutText":"Professional streamer and content creator bringing you the best streaming tools and entertainment.","aboutImage":"/buckfoozle-profile.jpg","aboutImagePosition":"left"}},{"id":"twitch","type":"twitch-embed","title":"Twitch Stream","isEnabled":true,"orderIndex":3,"content":{"twitchChannel":"buckfoozle","embedType":"both"}},{"id":"tools","type":"tools","title":"Available Tools","isEnabled":true,"orderIndex":4,"content":{"toolsTitle":"Streaming Tools","showToolCards":true}}]'::jsonb,
    'system'
WHERE NOT EXISTS (SELECT 1 FROM customization_settings);

SELECT 'Admin and settings tables created successfully! 🚀' AS status,
       'Default admin users and settings have been configured.' AS message;
