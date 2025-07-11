-- Analytics Database Tables
-- Run this in your Supabase SQL Editor to add analytics functionality

-- Stream Analytics Data
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Subscription History
CREATE TABLE IF NOT EXISTS subscription_history (
  id BIGSERIAL PRIMARY KEY,
  broadcaster_id TEXT NOT NULL,
  subscriber_id TEXT NOT NULL,
  subscriber_name TEXT NOT NULL,
  tier INTEGER NOT NULL, -- 1000, 2000, 3000 for tier 1, 2, 3
  event_type TEXT NOT NULL, -- 'subscribe', 'resubscribe', 'gift', 'unsubscribe'
  months_subscribed INTEGER DEFAULT 0,
  cumulative_months INTEGER DEFAULT 0,
  streak_months INTEGER DEFAULT 0,
  is_gift BOOLEAN DEFAULT FALSE,
  gifter_id TEXT,
  gifter_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Follower History
CREATE TABLE IF NOT EXISTS follower_history (
  id BIGSERIAL PRIMARY KEY,
  broadcaster_id TEXT NOT NULL,
  follower_id TEXT NOT NULL,
  follower_name TEXT NOT NULL,
  followed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Stream Sessions
CREATE TABLE IF NOT EXISTS stream_sessions (
  id BIGSERIAL PRIMARY KEY,
  broadcaster_id TEXT NOT NULL,
  stream_id TEXT NOT NULL,
  title TEXT,
  game_name TEXT,
  game_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  peak_viewers INTEGER DEFAULT 0,
  average_viewers INTEGER DEFAULT 0,
  total_bits INTEGER DEFAULT 0,
  new_followers INTEGER DEFAULT 0,
  new_subscribers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Chat Analytics
CREATE TABLE IF NOT EXISTS chat_analytics (
  id BIGSERIAL PRIMARY KEY,
  broadcaster_id TEXT NOT NULL,
  date DATE NOT NULL,
  total_messages INTEGER DEFAULT 0,
  unique_chatters INTEGER DEFAULT 0,
  average_messages_per_hour INTEGER DEFAULT 0,
  top_chatters JSONB, -- Store top 10 chatters with message counts
  most_used_emotes JSONB, -- Store most used emotes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stream_analytics_broadcaster_date ON stream_analytics(broadcaster_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_history_broadcaster ON subscription_history(broadcaster_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follower_history_broadcaster ON follower_history(broadcaster_id, followed_at DESC);
CREATE INDEX IF NOT EXISTS idx_stream_sessions_broadcaster ON stream_sessions(broadcaster_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_broadcaster_date ON chat_analytics(broadcaster_id, date DESC);

-- Update triggers
CREATE OR REPLACE FUNCTION update_analytics_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stream_analytics_updated_at 
  BEFORE UPDATE ON stream_analytics 
  FOR EACH ROW EXECUTE PROCEDURE update_analytics_updated_at_column();

-- Sample data for testing (optional - remove in production)
INSERT INTO stream_analytics (broadcaster_id, broadcaster_name, date, total_stream_time_minutes, peak_viewers, average_viewers, follower_count, subscriber_count, tier1_subs, tier2_subs, tier3_subs, total_bits, chat_messages, unique_chatters, raids_received, raids_sent)
VALUES 
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '30 days', 180, 1250, 890, 15420, 245, 180, 45, 20, 12500, 3450, 125, 2, 1),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '29 days', 240, 1450, 920, 15450, 248, 183, 45, 20, 15600, 4200, 145, 1, 0),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '28 days', 0, 0, 0, 15450, 248, 183, 45, 20, 0, 0, 0, 0, 0),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '27 days', 300, 1650, 1100, 15485, 252, 186, 46, 20, 18900, 5100, 165, 3, 2),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '26 days', 210, 1200, 850, 15510, 255, 189, 46, 20, 11200, 3200, 110, 1, 1),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '25 days', 195, 1100, 780, 15535, 258, 192, 46, 20, 9800, 2900, 98, 0, 0),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '24 days', 270, 1580, 1050, 15580, 262, 196, 46, 20, 16700, 4800, 155, 2, 1),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '23 days', 0, 0, 0, 15580, 262, 196, 46, 20, 0, 0, 0, 0, 0),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '22 days', 225, 1350, 950, 15620, 265, 199, 46, 20, 13400, 3800, 132, 1, 0),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '21 days', 315, 1750, 1200, 15665, 270, 203, 47, 20, 21200, 5600, 185, 4, 2),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '20 days', 180, 1050, 750, 15690, 273, 206, 47, 20, 8900, 2600, 92, 0, 1),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '19 days', 255, 1480, 1020, 15725, 276, 209, 47, 20, 17800, 4900, 170, 2, 1),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '18 days', 0, 0, 0, 15725, 276, 209, 47, 20, 0, 0, 0, 0, 0),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '17 days', 290, 1620, 1080, 15770, 280, 212, 48, 20, 19500, 5300, 178, 3, 2),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '16 days', 205, 1180, 820, 15795, 283, 215, 48, 20, 10600, 3100, 105, 1, 0),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '15 days', 240, 1400, 980, 15830, 287, 219, 48, 20, 14900, 4200, 148, 2, 1),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '14 days', 185, 1120, 800, 15850, 290, 222, 48, 20, 9200, 2800, 95, 0, 0),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '13 days', 0, 0, 0, 15850, 290, 222, 48, 20, 0, 0, 0, 0, 0),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '12 days', 265, 1520, 1040, 15890, 294, 226, 48, 20, 16800, 4700, 162, 2, 1),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '11 days', 195, 1080, 770, 15915, 297, 229, 48, 20, 8700, 2500, 88, 1, 0),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '10 days', 280, 1650, 1150, 15960, 302, 233, 49, 20, 18900, 5200, 175, 3, 2),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '9 days', 220, 1280, 900, 15985, 305, 236, 49, 20, 12100, 3600, 125, 1, 1),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '8 days', 0, 0, 0, 15985, 305, 236, 49, 20, 0, 0, 0, 0, 0),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '7 days', 245, 1420, 990, 16025, 309, 240, 49, 20, 15200, 4300, 152, 2, 1),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '6 days', 300, 1720, 1220, 16070, 314, 244, 50, 20, 20800, 5800, 195, 4, 2),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '5 days', 175, 1020, 730, 16090, 317, 247, 50, 20, 8200, 2400, 82, 0, 0),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '4 days', 260, 1500, 1050, 16125, 321, 251, 50, 20, 17300, 4800, 165, 2, 1),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '3 days', 0, 0, 0, 16125, 321, 251, 50, 20, 0, 0, 0, 0, 0),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '2 days', 285, 1600, 1120, 16170, 326, 255, 51, 20, 19200, 5400, 182, 3, 2),
  ('test_broadcaster', 'Test Streamer', CURRENT_DATE - INTERVAL '1 day', 210, 1250, 880, 16195, 329, 258, 51, 20, 11800, 3400, 118, 1, 0);
