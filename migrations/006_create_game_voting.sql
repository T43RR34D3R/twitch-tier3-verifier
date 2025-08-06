-- Migration 006: Create game voting system tables

-- Create games table
CREATE TABLE IF NOT EXISTS games (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    steam_app_id TEXT,
    igdb_id TEXT,
    cover_image_url TEXT,
    description TEXT,
    genre TEXT,
    release_date DATE,
    developer TEXT,
    publisher TEXT,
    steam_url TEXT,
    added_by_user_id TEXT NOT NULL,
    added_by_user_name TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create votes table
CREATE TABLE IF NOT EXISTS game_votes (
    id BIGSERIAL PRIMARY KEY,
    game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create game sources table for tracking where games come from
CREATE TABLE IF NOT EXISTS game_sources (
    id BIGSERIAL PRIMARY KEY,
    game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL, -- 'steam', 'igdb', 'manual'
    source_id TEXT NOT NULL, -- steam app id, igdb id, or 'manual'
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);
CREATE INDEX IF NOT EXISTS idx_games_steam_app_id ON games(steam_app_id);
CREATE INDEX IF NOT EXISTS idx_games_igdb_id ON games(igdb_id);
CREATE INDEX IF NOT EXISTS idx_games_added_by ON games(added_by_user_id);
CREATE INDEX IF NOT EXISTS idx_games_verified ON games(verified);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_votes_game_id ON game_votes(game_id);
CREATE INDEX IF NOT EXISTS idx_game_votes_user_id ON game_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_game_votes_created_at ON game_votes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_sources_game_id ON game_sources(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sources_type ON game_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_game_sources_source_id ON game_sources(source_id);

-- Create unique constraint to prevent duplicate votes per user per game
ALTER TABLE game_votes ADD CONSTRAINT unique_user_game_vote UNIQUE (user_id, game_id);

-- Create unique constraint to prevent duplicate games by steam app id
ALTER TABLE games ADD CONSTRAINT unique_steam_app_id UNIQUE (steam_app_id) WHERE steam_app_id IS NOT NULL;

-- Create unique constraint to prevent duplicate games by igdb id
ALTER TABLE games ADD CONSTRAINT unique_igdb_id UNIQUE (igdb_id) WHERE igdb_id IS NOT NULL;

-- Create trigger to automatically update updated_at for games
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert some example games to start with
INSERT INTO games (name, description, genre, added_by_user_id, added_by_user_name, verified, cover_image_url)
VALUES 
('Minecraft', 'A sandbox game where players can build and explore infinite worlds', 'Sandbox', 'system', 'System', true, 'https://cdn.cloudflare.steamstatic.com/steam/apps/1517830/header.jpg'),
('Among Us', 'A multiplayer party game of teamwork and betrayal', 'Party/Social Deduction', 'system', 'System', true, 'https://cdn.cloudflare.steamstatic.com/steam/apps/945360/header.jpg'),
('Fall Guys', 'A massively multiplayer party royale game', 'Battle Royale/Party', 'system', 'System', true, 'https://cdn.cloudflare.steamstatic.com/steam/apps/1097150/header.jpg'),
('Valorant', 'A tactical first-person shooter', 'FPS/Tactical', 'system', 'System', true, 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt5ba6a2f705e7e14c/5e9892adae18540ca2e65e88/Val_NeonPremiere_KeyArt_TextLogo_FINAL_16x9.png');
