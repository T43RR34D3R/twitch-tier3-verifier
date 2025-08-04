-- TwitchTracker Historical Data Tables
-- Run this migration to create tables for storing TwitchTracker data history

-- Channel overview data (daily snapshots)
CREATE TABLE IF NOT EXISTS twitchtracker_channel_data (
    id BIGSERIAL PRIMARY KEY,
    channel_id VARCHAR(50) NOT NULL,
    channel_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    
    -- Subscriber data
    current_active_subs INTEGER DEFAULT 0,
    paid_active_subs INTEGER,
    gifted_active_subs INTEGER DEFAULT 0,
    all_time_high_subs INTEGER DEFAULT 0,
    prime_subs INTEGER DEFAULT 0,
    tier1_subs INTEGER DEFAULT 0,
    tier2_subs INTEGER DEFAULT 0,
    tier3_subs INTEGER DEFAULT 0,
    
    -- Channel stats
    total_followers INTEGER DEFAULT 0,
    avg_viewers_30_days INTEGER DEFAULT 0,
    twitch_rank INTEGER,
    top_percentage VARCHAR(10),
    
    -- Lifetime overview
    total_hours_streamed DECIMAL(10,2) DEFAULT 0,
    highest_viewer_count INTEGER DEFAULT 0,
    highest_viewer_date TIMESTAMP,
    total_games_streamed INTEGER DEFAULT 0,
    
    -- Activity metrics
    active_days_per_week DECIMAL(3,1) DEFAULT 0,
    total_games_played INTEGER DEFAULT 0,
    usual_stream_start_time TIME,
    overall_activity_days INTEGER DEFAULT 0,
    overall_activity_total INTEGER DEFAULT 0,
    
    -- Status info
    last_live_date TIMESTAMP,
    language VARCHAR(50) DEFAULT 'English',
    created_date TIMESTAMP,
    partner_status VARCHAR(50),
    description TEXT,
    
    -- Metadata
    data_date DATE NOT NULL DEFAULT CURRENT_DATE,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(channel_id, data_date)
);

-- Stream history data
CREATE TABLE IF NOT EXISTS twitchtracker_stream_history (
    id BIGSERIAL PRIMARY KEY,
    channel_id VARCHAR(50) NOT NULL,
    stream_date TIMESTAMP NOT NULL,
    title TEXT,
    game_name VARCHAR(200),
    duration_minutes INTEGER DEFAULT 0,
    max_viewers INTEGER DEFAULT 0,
    followers_gained INTEGER DEFAULT 0,
    
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(channel_id, stream_date)
);

-- Game statistics history
CREATE TABLE IF NOT EXISTS twitchtracker_game_stats (
    id BIGSERIAL PRIMARY KEY,
    channel_id VARCHAR(50) NOT NULL,
    game_name VARCHAR(200) NOT NULL,
    game_id VARCHAR(50),
    
    -- Game performance metrics
    avg_viewers INTEGER DEFAULT 0,
    total_hours_streamed DECIMAL(10,2) DEFAULT 0,
    followers_gained INTEGER DEFAULT 0,
    peak_viewers INTEGER DEFAULT 0,
    
    -- Time period
    data_date DATE NOT NULL DEFAULT CURRENT_DATE,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(channel_id, game_name, data_date)
);

-- Subscriber tier breakdown history
CREATE TABLE IF NOT EXISTS twitchtracker_sub_breakdown (
    id BIGSERIAL PRIMARY KEY,
    channel_id VARCHAR(50) NOT NULL,
    
    -- Monthly subscription counts
    month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    total_subs INTEGER DEFAULT 0,
    tier1_prime_subs INTEGER DEFAULT 0,
    tier2_subs INTEGER DEFAULT 0,
    tier3_subs INTEGER DEFAULT 0,
    undefined_subs INTEGER DEFAULT 0,
    gifted_subs INTEGER DEFAULT 0,
    
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(channel_id, month_year)
);

-- Performance metrics over time (for detailed analytics)
CREATE TABLE IF NOT EXISTS twitchtracker_performance_metrics (
    id BIGSERIAL PRIMARY KEY,
    channel_id VARCHAR(50) NOT NULL,
    
    -- Time period (can be daily, weekly, monthly)
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Viewer metrics
    avg_viewers INTEGER DEFAULT 0,
    max_viewers INTEGER DEFAULT 0,
    total_watch_time_hours DECIMAL(12,2) DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    
    -- Growth metrics
    followers_start INTEGER DEFAULT 0,
    followers_end INTEGER DEFAULT 0,
    followers_gained INTEGER DEFAULT 0,
    subs_start INTEGER DEFAULT 0,
    subs_end INTEGER DEFAULT 0,
    subs_gained INTEGER DEFAULT 0,
    
    -- Stream activity
    total_streams INTEGER DEFAULT 0,
    total_stream_time_hours DECIMAL(10,2) DEFAULT 0,
    avg_stream_duration_minutes INTEGER DEFAULT 0,
    
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(channel_id, period_type, period_start)
);

-- Top games ranking over time
CREATE TABLE IF NOT EXISTS twitchtracker_top_games (
    id BIGSERIAL PRIMARY KEY,
    
    -- Game info
    game_name VARCHAR(200) NOT NULL,
    game_rank INTEGER NOT NULL,
    avg_viewers INTEGER DEFAULT 0,
    viewer_share_percentage DECIMAL(5,3) DEFAULT 0,
    change_7_days DECIMAL(5,1) DEFAULT 0,
    
    -- Time tracking
    data_date DATE NOT NULL DEFAULT CURRENT_DATE,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(game_name, data_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_twitchtracker_channel_data_channel_id ON twitchtracker_channel_data(channel_id);
CREATE INDEX IF NOT EXISTS idx_twitchtracker_channel_data_date ON twitchtracker_channel_data(data_date);
CREATE INDEX IF NOT EXISTS idx_twitchtracker_stream_history_channel_id ON twitchtracker_stream_history(channel_id);
CREATE INDEX IF NOT EXISTS idx_twitchtracker_stream_history_date ON twitchtracker_stream_history(stream_date);
CREATE INDEX IF NOT EXISTS idx_twitchtracker_game_stats_channel_id ON twitchtracker_game_stats(channel_id);
CREATE INDEX IF NOT EXISTS idx_twitchtracker_game_stats_date ON twitchtracker_game_stats(data_date);
CREATE INDEX IF NOT EXISTS idx_twitchtracker_sub_breakdown_channel_id ON twitchtracker_sub_breakdown(channel_id);
CREATE INDEX IF NOT EXISTS idx_twitchtracker_performance_metrics_channel_id ON twitchtracker_performance_metrics(channel_id);
CREATE INDEX IF NOT EXISTS idx_twitchtracker_performance_metrics_period ON twitchtracker_performance_metrics(period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_twitchtracker_top_games_date ON twitchtracker_top_games(data_date);

-- Enable Row Level Security
ALTER TABLE twitchtracker_channel_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitchtracker_stream_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitchtracker_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitchtracker_sub_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitchtracker_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitchtracker_top_games ENABLE ROW LEVEL SECURITY;

-- Create policies for data access (adjust based on your needs)
CREATE POLICY "Allow read access to twitchtracker data" ON twitchtracker_channel_data FOR SELECT USING (true);
CREATE POLICY "Allow read access to stream history" ON twitchtracker_stream_history FOR SELECT USING (true);
CREATE POLICY "Allow read access to game stats" ON twitchtracker_game_stats FOR SELECT USING (true);
CREATE POLICY "Allow read access to sub breakdown" ON twitchtracker_sub_breakdown FOR SELECT USING (true);
CREATE POLICY "Allow read access to performance metrics" ON twitchtracker_performance_metrics FOR SELECT USING (true);
CREATE POLICY "Allow read access to top games" ON twitchtracker_top_games FOR SELECT USING (true);

-- Grant necessary permissions (adjust role as needed)
GRANT SELECT, INSERT, UPDATE ON twitchtracker_channel_data TO authenticated;
GRANT SELECT, INSERT, UPDATE ON twitchtracker_stream_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON twitchtracker_game_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE ON twitchtracker_sub_breakdown TO authenticated;
GRANT SELECT, INSERT, UPDATE ON twitchtracker_performance_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON twitchtracker_top_games TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE twitchtracker_channel_data_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE twitchtracker_stream_history_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE twitchtracker_game_stats_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE twitchtracker_sub_breakdown_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE twitchtracker_performance_metrics_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE twitchtracker_top_games_id_seq TO authenticated;
