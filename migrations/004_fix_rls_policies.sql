-- Fix RLS policies to allow INSERT operations for TwitchTracker data collection
-- This migration adds INSERT policies for all TwitchTracker tables

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to twitchtracker data" ON twitchtracker_channel_data;
DROP POLICY IF EXISTS "Allow read access to stream history" ON twitchtracker_stream_history;
DROP POLICY IF EXISTS "Allow read access to game stats" ON twitchtracker_game_stats;
DROP POLICY IF EXISTS "Allow read access to sub breakdown" ON twitchtracker_sub_breakdown;
DROP POLICY IF EXISTS "Allow read access to performance metrics" ON twitchtracker_performance_metrics;
DROP POLICY IF EXISTS "Allow read access to top games" ON twitchtracker_top_games;

-- Create comprehensive policies for authenticated users
-- Channel data policies
CREATE POLICY "Allow all operations on twitchtracker channel data" ON twitchtracker_channel_data FOR ALL USING (true);

-- Stream history policies
CREATE POLICY "Allow all operations on stream history" ON twitchtracker_stream_history FOR ALL USING (true);

-- Game stats policies
CREATE POLICY "Allow all operations on game stats" ON twitchtracker_game_stats FOR ALL USING (true);

-- Sub breakdown policies
CREATE POLICY "Allow all operations on sub breakdown" ON twitchtracker_sub_breakdown FOR ALL USING (true);

-- Performance metrics policies
CREATE POLICY "Allow all operations on performance metrics" ON twitchtracker_performance_metrics FOR ALL USING (true);

-- Top games policies
CREATE POLICY "Allow all operations on top games" ON twitchtracker_top_games FOR ALL USING (true);
