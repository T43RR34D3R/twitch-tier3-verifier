import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/railway-db';

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const adminIds = ['441862265', '269187200']; // Buckfoozle's IDs
  return adminIds.includes(userId);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admin users
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 });
    }

    console.log('Checking database status...');

    // Check what tables exist
    const tablesQuery = `
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    const tablesResult = await query(tablesQuery);
    const tables = tablesResult.rows;

    // Check for specific game voting tables
    const gameTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'voting_users', 'games', 'game_votes')
      ORDER BY table_name
    `;
    
    const gameTablesResult = await query(gameTablesQuery);
    const gameTables = gameTablesResult.rows.map(row => row.table_name);

    // Check counts for each table
    const counts: Record<string, number | string> = {};
    
    for (const tableName of gameTables) {
      try {
        const countResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
        counts[tableName] = parseInt(countResult.rows[0].count);
      } catch (error) {
        counts[tableName] = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    // Check if we have any sample data
    const sampleData: Record<string, Record<string, unknown>[]> = {};
    
    if (typeof counts.users === 'number' && counts.users > 0) {
      const usersResult = await query('SELECT twitch_user_id, twitch_username, created_at FROM users LIMIT 3');
      sampleData.users = usersResult.rows;
    }
    
    if (typeof counts.games === 'number' && counts.games > 0) {
      const gamesResult = await query('SELECT id, name, added_by_username, created_at FROM games LIMIT 3');
      sampleData.games = gamesResult.rows;
    }
    
    if (typeof counts.game_votes === 'number' && counts.game_votes > 0) {
      const votesResult = await query('SELECT id, game_id, user_id, username, voted_at FROM game_votes LIMIT 3');
      sampleData.votes = votesResult.rows;
    }

    return NextResponse.json({
      success: true,
      message: "Database check completed",
      data: {
        allTables: tables,
        gameVotingTables: gameTables,
        tableCounts: counts,
        sampleData: sampleData,
        currentUser: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email
        }
      }
    });

  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json(
      { error: 'Failed to check database: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
