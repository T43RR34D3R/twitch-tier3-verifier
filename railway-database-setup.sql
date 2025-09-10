-- =====================================================
-- RAILWAY POSTGRESQL COMPLETE DATABASE SETUP
-- =====================================================
-- This script creates all existing tables + new voting system
-- Run this in Railway PostgreSQL console

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Analytics update trigger function
CREATE OR REPLACE FUNCTION update_analytics_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- EXISTING CORE TABLES (from your Supabase setup)
-- =====================================================

-- Verification logs table
CREATE TABLE IF NOT EXISTS verification_logs (
  id BIGSERIAL PRIMARY KEY,
  user_name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Page settings table
CREATE TABLE IF NOT EXISTS page_settings (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  sign_in_text TEXT NOT NULL,
  steps JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Subscribers table
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

-- =====================================================
-- SUBATHON TIMER TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subathon_timer (
    id SERIAL PRIMARY KEY,
    end_time BIGINT DEFAULT 0,
    is_running BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'Timer Ready - Set time to begin!',
    pending_duration INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- USER AUTHENTICATION & TOKENS
-- =====================================================

-- Analytics access control
CREATE TABLE IF NOT EXISTS analytics_access (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  user_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  granted_by TEXT,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- User tokens for background data collection
CREATE TABLE IF NOT EXISTS user_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- MINECRAFT INTEGRATION TABLES
-- =====================================================

-- Minecraft authorization pending requests
CREATE TABLE IF NOT EXISTS minecraft_auth_pending (
    auth_code VARCHAR(64) PRIMARY KEY,
    minecraft_username VARCHAR(16) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Minecraft authorization completed
CREATE TABLE IF NOT EXISTS minecraft_auth_completed (
    auth_code VARCHAR(64) PRIMARY KEY,
    minecraft_username VARCHAR(16) NOT NULL,
    twitch_username VARCHAR(25) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Minecraft-Twitch account links
CREATE TABLE IF NOT EXISTS minecraft_twitch_links (
    minecraft_username VARCHAR(16) PRIMARY KEY,
    twitch_username VARCHAR(25) NOT NULL,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NEW: SUBATHON VOTING SYSTEM TABLES
-- =====================================================

-- Games table for voting
CREATE TABLE IF NOT EXISTS games (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    steam_id VARCHAR(50),
    steam_url TEXT,
    image_url TEXT,
    genre VARCHAR(100),
    developer VARCHAR(255),
    publisher VARCHAR(255),
    release_date DATE,
    
    -- Voting data
    vote_count INTEGER DEFAULT 0,
    
    -- Metadata
    added_by_user_id TEXT NOT NULL,
    added_by_username VARCHAR(100) NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Votes table
CREATE TABLE IF NOT EXISTS game_votes (
    id BIGSERIAL PRIMARY KEY,
    game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Twitch user ID
    username VARCHAR(100) NOT NULL, -- Twitch username
    
    -- Vote tracking
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Prevent duplicate votes per user per game
    UNIQUE(game_id, user_id)
);

-- Vote sessions (for tracking voting periods)
CREATE TABLE IF NOT EXISTS voting_sessions (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Session timing
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT false,
    is_complete BOOLEAN DEFAULT false,
    
    -- Results
    winning_game_id BIGINT REFERENCES games(id),
    total_votes INTEGER DEFAULT 0,
    
    -- Metadata
    created_by_user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- User authentication for voting (extends basic user data)
CREATE TABLE IF NOT EXISTS voting_users (
    id BIGSERIAL PRIMARY KEY,
    
    -- Twitch data
    twitch_user_id TEXT NOT NULL UNIQUE,
    twitch_username VARCHAR(100) NOT NULL,
    twitch_display_name VARCHAR(100),
    twitch_avatar_url TEXT,
    
    -- Discord data (optional)
    discord_user_id TEXT,
    discord_username VARCHAR(100),
    discord_discriminator VARCHAR(4),
    discord_avatar_url TEXT,
    
    -- Voting permissions
    can_vote BOOLEAN DEFAULT true,
    can_submit_games BOOLEAN DEFAULT true,
    is_moderator BOOLEAN DEFAULT false,
    
    -- Activity tracking
    last_vote_at TIMESTAMP WITH TIME ZONE,
    total_votes INTEGER DEFAULT 0,
    games_submitted INTEGER DEFAULT 0,
    
    -- Timestamps
    first_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Game submission queue (for moderation)
CREATE TABLE IF NOT EXISTS game_submissions (
    id BIGSERIAL PRIMARY KEY,
    
    -- Game data
    name VARCHAR(255) NOT NULL,
    steam_url TEXT,
    steam_id VARCHAR(50),
    description TEXT,
    submitted_reason TEXT, -- Why they want this game
    
    -- Steam API data (auto-populated)
    steam_data JSONB,
    
    -- Submission info
    submitted_by_user_id TEXT NOT NULL,
    submitted_by_username VARCHAR(100) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    reviewed_by_user_id TEXT,
    reviewed_by_username VARCHAR(100),
    review_notes TEXT,
    
    -- If approved, link to created game
    approved_game_id BIGINT REFERENCES games(id),
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- CUSTOMIZATION TABLES
-- =====================================================

-- Site customization settings
CREATE TABLE IF NOT EXISTS customization_settings (
  id BIGSERIAL PRIMARY KEY,
  settings JSONB NOT NULL DEFAULT '{}',
  menu_items JSONB NOT NULL DEFAULT '[]',
  home_sections JSONB NOT NULL DEFAULT '[]',
  updated_by TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Navigation settings 
CREATE TABLE IF NOT EXISTS navigation_settings (
  id BIGSERIAL PRIMARY KEY,
  menu_items JSONB NOT NULL DEFAULT '[]',
  updated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- ANALYTICS TABLES (existing)
-- =====================================================

-- Chat highlights table (for browser extension)
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

-- Stream analytics data
CREATE TABLE IF NOT EXISTS stream_analytics (
  id BIGSERIAL PRIMARY KEY,
  broadcaster_id TEXT NOT NULL,
  broadcaster_name TEXT NOT NULL,
  date DATE NOT NULL,
  total_stream_time_minutes INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  average_viewers INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  subscriber_count INTEGER DEFAULT 0,
  tier1_subs INTEGER DEFAULT 0,
  tier2_subs INTEGER DEFAULT 0,
  tier3_subs INTEGER DEFAULT 0,
  total_bits INTEGER DEFAULT 0,
  chat_messages INTEGER DEFAULT 0,
  unique_chatters INTEGER DEFAULT 0,
  raids_received INTEGER DEFAULT 0,
  raids_sent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Existing table indexes
CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at ON verification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_logs_user_id ON verification_logs(user_id);

-- Chat highlights indexes
CREATE INDEX IF NOT EXISTS idx_chat_highlights_channel ON chat_highlights(channel);
CREATE INDEX IF NOT EXISTS idx_chat_highlights_username ON chat_highlights(username);
CREATE INDEX IF NOT EXISTS idx_chat_highlights_timestamp ON chat_highlights(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_highlights_created_at ON chat_highlights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_highlights_message_id ON chat_highlights(message_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_broadcaster_id ON subscribers(broadcaster_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_tier ON subscribers(tier);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_minecraft_auth_pending_expires ON minecraft_auth_pending(expires_at);

-- Voting system indexes
CREATE INDEX IF NOT EXISTS idx_games_vote_count ON games(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_steam_id ON games(steam_id);
CREATE INDEX IF NOT EXISTS idx_games_added_by ON games(added_by_user_id);
CREATE INDEX IF NOT EXISTS idx_game_votes_game_id ON game_votes(game_id);
CREATE INDEX IF NOT EXISTS idx_game_votes_user_id ON game_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_game_votes_voted_at ON game_votes(voted_at DESC);
CREATE INDEX IF NOT EXISTS idx_voting_users_twitch_id ON voting_users(twitch_user_id);
CREATE INDEX IF NOT EXISTS idx_game_submissions_status ON game_submissions(status);
CREATE INDEX IF NOT EXISTS idx_game_submissions_submitted_at ON game_submissions(submitted_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update triggers for timestamp management
DROP TRIGGER IF EXISTS update_page_settings_updated_at ON page_settings;
CREATE TRIGGER update_page_settings_updated_at 
  BEFORE UPDATE ON page_settings 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscribers_updated_at ON subscribers;
CREATE TRIGGER update_subscribers_updated_at 
  BEFORE UPDATE ON subscribers 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_subathon_timer_updated_at ON subathon_timer;
CREATE TRIGGER update_subathon_timer_updated_at
  BEFORE UPDATE ON subathon_timer
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_minecraft_twitch_links_updated_at ON minecraft_twitch_links;
CREATE TRIGGER update_minecraft_twitch_links_updated_at
  BEFORE UPDATE ON minecraft_twitch_links
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_tokens_updated_at ON user_tokens;
CREATE TRIGGER update_user_tokens_updated_at 
  BEFORE UPDATE ON user_tokens 
  FOR EACH ROW EXECUTE PROCEDURE update_analytics_updated_at_column();

DROP TRIGGER IF EXISTS update_stream_analytics_updated_at ON stream_analytics;
CREATE TRIGGER update_stream_analytics_updated_at 
  BEFORE UPDATE ON stream_analytics 
  FOR EACH ROW EXECUTE PROCEDURE update_analytics_updated_at_column();

-- Chat highlights trigger
DROP TRIGGER IF EXISTS update_chat_highlights_updated_at ON chat_highlights;
CREATE TRIGGER update_chat_highlights_updated_at 
  BEFORE UPDATE ON chat_highlights 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Voting system triggers
DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at 
  BEFORE UPDATE ON games 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_voting_sessions_updated_at ON voting_sessions;
CREATE TRIGGER update_voting_sessions_updated_at 
  BEFORE UPDATE ON voting_sessions 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_voting_users_updated_at ON voting_users;
CREATE TRIGGER update_voting_users_updated_at 
  BEFORE UPDATE ON voting_users 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_submissions_updated_at ON game_submissions;
CREATE TRIGGER update_game_submissions_updated_at 
  BEFORE UPDATE ON game_submissions 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Customization system triggers
DROP TRIGGER IF EXISTS update_customization_settings_updated_at ON customization_settings;
CREATE TRIGGER update_customization_settings_updated_at 
  BEFORE UPDATE ON customization_settings 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_navigation_settings_updated_at ON navigation_settings;
CREATE TRIGGER update_navigation_settings_updated_at 
  BEFORE UPDATE ON navigation_settings 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Prevent duplicate subscribers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_subscriber' 
        AND table_name = 'subscribers'
    ) THEN
        ALTER TABLE subscribers ADD CONSTRAINT unique_subscriber UNIQUE (user_id, broadcaster_id);
    END IF;
END $$;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default page settings if none exist
INSERT INTO page_settings (title, subtitle, sign_in_text, steps)
SELECT 
  'Tier 3 Verification & Subathon Voting',
  'Verify your Tier 3 subscription and vote for games to play during the subathon!',
  'Please sign in with your Twitch account to verify your subscription status and participate in voting.',
  '["Signed In", "Checking Follow", "Checking Tier 3", "Voting Enabled", "Verified"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM page_settings);

-- Insert initial timer state if none exists
INSERT INTO subathon_timer (end_time, is_running, status, pending_duration) 
VALUES (0, false, 'Timer Ready - Set time to begin!', 0)
ON CONFLICT DO NOTHING;

-- Insert admin analytics access
INSERT INTO analytics_access (user_id, user_name, enabled, granted_by)
VALUES ('441862265', 'Buckfoozle', true, 'system')
ON CONFLICT (user_id) DO UPDATE SET enabled = true;

INSERT INTO analytics_access (user_id, user_name, enabled, granted_by)
VALUES ('269187200', 'Buckfoozle', true, 'system')
ON CONFLICT (user_id) DO UPDATE SET enabled = true;

-- =====================================================
-- SAMPLE VOTING DATA (Optional - remove in production)
-- =====================================================

-- Sample games for testing
INSERT INTO games (name, description, steam_id, steam_url, image_url, added_by_user_id, added_by_username, vote_count)
VALUES 
  ('Minecraft', 'The classic block-building game perfect for long streams', '1086940', 'https://store.steampowered.com/app/1086940/Minecraft/', 'https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg', '441862265', 'Buckfoozle', 0),
  ('Terraria', '2D sandbox adventure game with tons content', '105600', 'https://store.steampowered.com/app/105600/Terraria/', 'https://cdn.akamai.steamstatic.com/steam/apps/105600/header.jpg', '441862265', 'Buckfoozle', 0),
  ('Stardew Valley', 'Relaxing farming simulation perfect for chill streams', '413150', 'https://store.steampowered.com/app/413150/Stardew_Valley/', 'https://cdn.akamai.steamstatic.com/steam/apps/413150/header.jpg', '441862265', 'Buckfoozle', 0)
ON CONFLICT DO NOTHING;

-- Sample voting session
INSERT INTO voting_sessions (title, description, starts_at, ends_at, is_active, created_by_user_id)
VALUES (
  'Subathon Game Selection',
  'Vote for which games you want to see during the upcoming subathon!',
  NOW(),
  NOW() + INTERVAL '7 days',
  true,
  '441862265'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Railway database setup completed successfully! 🎉' AS status,
       'All tables created with voting system ready!' AS message;
