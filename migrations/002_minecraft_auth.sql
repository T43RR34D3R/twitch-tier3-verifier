-- Migration: Add Minecraft Authorization Tables
-- This migration adds the necessary tables for the TwitchNotifier Minecraft plugin

-- Table to store pending authorization requests
CREATE TABLE IF NOT EXISTS minecraft_auth_pending (
    auth_code VARCHAR(64) PRIMARY KEY,
    minecraft_username VARCHAR(16) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Table to store completed authorizations (temporary storage for status checking)
CREATE TABLE IF NOT EXISTS minecraft_auth_completed (
    auth_code VARCHAR(64) PRIMARY KEY,
    minecraft_username VARCHAR(16) NOT NULL,
    twitch_username VARCHAR(25) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store permanent Minecraft <-> Twitch account links
CREATE TABLE IF NOT EXISTS minecraft_twitch_links (
    minecraft_username VARCHAR(16) PRIMARY KEY,
    twitch_username VARCHAR(25) NOT NULL,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_minecraft_auth_pending_expires ON minecraft_auth_pending(expires_at);
CREATE INDEX IF NOT EXISTS idx_minecraft_auth_completed_twitch ON minecraft_auth_completed(twitch_username);
CREATE INDEX IF NOT EXISTS idx_minecraft_twitch_links_twitch ON minecraft_twitch_links(twitch_username);

-- Clean up expired pending authorizations (can be run periodically)
-- This is just an example query, you might want to set up a cron job for this
-- DELETE FROM minecraft_auth_pending WHERE expires_at < NOW() - INTERVAL '1 hour';

COMMENT ON TABLE minecraft_auth_pending IS 'Stores pending Minecraft authorization requests with 5-minute expiry';
COMMENT ON TABLE minecraft_auth_completed IS 'Temporary storage for completed authorizations during plugin polling';
COMMENT ON TABLE minecraft_twitch_links IS 'Permanent storage of Minecraft username to Twitch username links';
