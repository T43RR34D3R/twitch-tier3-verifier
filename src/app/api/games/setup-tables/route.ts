import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/railway-db';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admin users
    if (!session?.user?.id || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 });
    }

    console.log('Setting up games and user tables...');

    // Create all necessary tables for the games voting system
    const setupQueries = [
      // Create main users table for all authenticated users
      `CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        twitch_user_id TEXT NOT NULL UNIQUE,
        twitch_username VARCHAR(100) NOT NULL,
        twitch_display_name VARCHAR(100),
        email TEXT,
        profile_image_url TEXT,
        first_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        total_logins INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )`,

      // Create voting_users table (for game voting system)
      `CREATE TABLE IF NOT EXISTS voting_users (
        id BIGSERIAL PRIMARY KEY,
        twitch_user_id TEXT NOT NULL UNIQUE,
        twitch_username VARCHAR(100) NOT NULL,
        twitch_display_name VARCHAR(100),
        profile_image_url TEXT,
        total_votes INTEGER DEFAULT 0,
        first_vote_at TIMESTAMP WITH TIME ZONE,
        last_vote_at TIMESTAMP WITH TIME ZONE,
        last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )`,

      // Create games table
      `CREATE TABLE IF NOT EXISTS games (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        steam_id VARCHAR(50),
        steam_url TEXT,
        image_url TEXT,
        genre VARCHAR(255),
        developer VARCHAR(255),
        publisher VARCHAR(255),
        release_date DATE,
        vote_count INTEGER DEFAULT 0,
        added_by_user_id TEXT NOT NULL,
        added_by_username VARCHAR(100) NOT NULL,
        is_approved BOOLEAN DEFAULT FALSE,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )`,

      // Create game_votes table
      `CREATE TABLE IF NOT EXISTS game_votes (
        id BIGSERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        username VARCHAR(100) NOT NULL,
        voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(game_id, user_id)
      )`,

      // Create update trigger function
      `CREATE OR REPLACE FUNCTION update_updated_at_column()
       RETURNS TRIGGER AS $$
       BEGIN
           NEW.updated_at = NOW();
           RETURN NEW;
       END;
       $$ language 'plpgsql'`,

      // Create triggers for timestamp management
      `DROP TRIGGER IF EXISTS update_users_updated_at ON users`,
      `CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

      `DROP TRIGGER IF EXISTS update_voting_users_updated_at ON voting_users`,
      `CREATE TRIGGER update_voting_users_updated_at 
        BEFORE UPDATE ON voting_users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

      `DROP TRIGGER IF EXISTS update_games_updated_at ON games`,
      `CREATE TRIGGER update_games_updated_at 
        BEFORE UPDATE ON games 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

      // Create indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_users_twitch_user_id ON users(twitch_user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_users_twitch_username ON users(twitch_username)`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at DESC)`,
      
      `CREATE INDEX IF NOT EXISTS idx_voting_users_twitch_user_id ON voting_users(twitch_user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_voting_users_total_votes ON voting_users(total_votes DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_voting_users_last_vote_at ON voting_users(last_vote_at DESC)`,
      
      `CREATE INDEX IF NOT EXISTS idx_games_name ON games(name)`,
      `CREATE INDEX IF NOT EXISTS idx_games_vote_count ON games(vote_count DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_games_is_approved ON games(is_approved)`,
      `CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_games_added_by_user_id ON games(added_by_user_id)`,
      
      `CREATE INDEX IF NOT EXISTS idx_game_votes_game_id ON game_votes(game_id)`,
      `CREATE INDEX IF NOT EXISTS idx_game_votes_user_id ON game_votes(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_game_votes_voted_at ON game_votes(voted_at DESC)`,
    ];

    // Execute all setup queries
    for (const sql of setupQueries) {
      await query(sql);
    }

    // Check what tables were created
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'voting_users', 'games', 'game_votes')
      ORDER BY table_name
    `;
    
    const tablesResult = await query(tablesQuery);
    const tables = tablesResult.rows.map(row => row.table_name);

    console.log('Games system database setup completed successfully');
    console.log('Created/verified tables:', tables);

    return NextResponse.json({
      success: true,
      message: "Games system database setup completed successfully!",
      tables: tables
    });

  } catch (error) {
    console.error('Games database setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup games database: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
