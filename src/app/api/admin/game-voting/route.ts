import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/railway-db';

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const adminIds = ['441862265', '269187200']; // Buckfoozle's IDs
  return adminIds.includes(userId);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'games';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    switch (view) {
      case 'games':
        return await getGamesOverview(limit, offset);
      case 'votes':
        return await getVotesDetails(limit, offset);
      case 'users':
        return await getUsersOverview(limit, offset);
      case 'submissions':
        return await getGameSubmissions(limit, offset);
      default:
        return NextResponse.json(
          { error: 'Invalid view parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in admin game voting API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

// Get games overview with vote counts and submission details
async function getGamesOverview(limit: number, offset: number) {
  const result = await query(`
    SELECT 
      g.id,
      g.name,
      g.description,
      g.steam_id,
      g.steam_url,
      g.image_url,
      g.genre,
      g.developer,
      g.publisher,
      g.release_date,
      g.vote_count,
      g.added_by_user_id,
      g.added_by_username,
      g.is_approved,
      g.is_featured,
      g.created_at,
      COUNT(gv.id) as actual_vote_count,
      ARRAY_AGG(
        DISTINCT jsonb_build_object(
          'user_id', gv.user_id,
          'username', gv.username,
          'voted_at', gv.voted_at
        ) ORDER BY gv.voted_at DESC
      ) FILTER (WHERE gv.id IS NOT NULL) as recent_votes
    FROM games g
    LEFT JOIN game_votes gv ON g.id = gv.game_id
    GROUP BY g.id
    ORDER BY COUNT(gv.id) DESC, g.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  // Get total count
  const countResult = await query('SELECT COUNT(*) as total FROM games');
  const total = parseInt(countResult.rows[0].total);

  return NextResponse.json({
    games: result.rows.map(row => ({
      ...row,
      recent_votes: row.recent_votes?.[0] ? row.recent_votes.slice(0, 10) : []
    })),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  });
}

// Get detailed vote information
async function getVotesDetails(limit: number, offset: number) {
  const result = await query(`
    SELECT 
      gv.id,
      gv.game_id,
      gv.user_id,
      gv.username,
      gv.voted_at,
      g.name as game_name,
      g.image_url as game_image,
      vu.total_votes as user_total_votes,
      vu.first_login_at as user_first_seen
    FROM game_votes gv
    JOIN games g ON gv.game_id = g.id
    LEFT JOIN voting_users vu ON gv.user_id = vu.twitch_user_id
    ORDER BY gv.voted_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  // Get total count
  const countResult = await query('SELECT COUNT(*) as total FROM game_votes');
  const total = parseInt(countResult.rows[0].total);

  return NextResponse.json({
    votes: result.rows,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  });
}

// Get users overview with their voting activity
async function getUsersOverview(limit: number, offset: number) {
  const result = await query(`
    SELECT 
      vu.twitch_user_id,
      vu.twitch_username,
      vu.twitch_display_name,
      vu.total_votes,
      vu.games_submitted,
      vu.can_vote,
      vu.can_submit_games,
      vu.first_login_at,
      vu.last_login_at,
      vu.last_vote_at,
      COUNT(gv.id) as actual_vote_count,
      COUNT(g.id) as actual_games_submitted,
      ARRAY_AGG(
        DISTINCT jsonb_build_object(
          'game_id', gv.game_id,
          'game_name', games.name,
          'voted_at', gv.voted_at
        ) ORDER BY gv.voted_at DESC
      ) FILTER (WHERE gv.id IS NOT NULL) as recent_votes,
      ARRAY_AGG(
        DISTINCT jsonb_build_object(
          'game_id', g.id,
          'game_name', g.name,
          'added_at', g.created_at
        ) ORDER BY g.created_at DESC
      ) FILTER (WHERE g.id IS NOT NULL) as submitted_games
    FROM voting_users vu
    LEFT JOIN game_votes gv ON vu.twitch_user_id = gv.user_id
    LEFT JOIN games g ON vu.twitch_user_id = g.added_by_user_id
    LEFT JOIN games ON gv.game_id = games.id
    GROUP BY vu.twitch_user_id
    ORDER BY vu.total_votes DESC, vu.last_login_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  // Get total count
  const countResult = await query('SELECT COUNT(*) as total FROM voting_users');
  const total = parseInt(countResult.rows[0].total);

  return NextResponse.json({
    users: result.rows.map(row => ({
      ...row,
      recent_votes: row.recent_votes?.[0] ? row.recent_votes.slice(0, 5) : [],
      submitted_games: row.submitted_games?.[0] ? row.submitted_games : []
    })),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  });
}

// Get game submissions (if using the submissions system)
async function getGameSubmissions(limit: number, offset: number) {
  const result = await query(`
    SELECT 
      gs.id,
      gs.name,
      gs.steam_url,
      gs.steam_id,
      gs.description,
      gs.submitted_reason,
      gs.steam_data,
      gs.submitted_by_user_id,
      gs.submitted_by_username,
      gs.status,
      gs.reviewed_by_user_id,
      gs.reviewed_by_username,
      gs.review_notes,
      gs.approved_game_id,
      gs.submitted_at,
      gs.reviewed_at,
      g.name as approved_game_name
    FROM game_submissions gs
    LEFT JOIN games g ON gs.approved_game_id = g.id
    ORDER BY gs.submitted_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  // Get total count
  const countResult = await query('SELECT COUNT(*) as total FROM game_submissions');
  const total = parseInt(countResult.rows[0].total);

  return NextResponse.json({
    submissions: result.rows,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  });
}

// POST method for admin actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, gameId, userId } = body;

    switch (action) {
      case 'toggle_game_approval':
        return await toggleGameApproval(gameId);
      case 'feature_game':
        return await toggleGameFeatured(gameId);
      case 'ban_user':
        return await banUser(userId);
      case 'delete_game':
        return await deleteGame(gameId);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in admin game voting action:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}

async function toggleGameApproval(gameId: number) {
  const result = await query(`
    UPDATE games 
    SET is_approved = NOT is_approved, updated_at = NOW()
    WHERE id = $1
    RETURNING id, name, is_approved
  `, [gameId]);

  if (result.rows.length === 0) {
    throw new Error('Game not found');
  }

  return NextResponse.json({
    message: `Game ${result.rows[0].is_approved ? 'approved' : 'unapproved'}`,
    game: result.rows[0]
  });
}

async function toggleGameFeatured(gameId: number) {
  const result = await query(`
    UPDATE games 
    SET is_featured = NOT is_featured, updated_at = NOW()
    WHERE id = $1
    RETURNING id, name, is_featured
  `, [gameId]);

  if (result.rows.length === 0) {
    throw new Error('Game not found');
  }

  return NextResponse.json({
    message: `Game ${result.rows[0].is_featured ? 'featured' : 'unfeatured'}`,
    game: result.rows[0]
  });
}

async function banUser(userId: string) {
  await query(`
    UPDATE voting_users 
    SET can_vote = false, can_submit_games = false, updated_at = NOW()
    WHERE twitch_user_id = $1
  `, [userId]);

  return NextResponse.json({
    message: 'User banned from voting and submitting games',
    userId
  });
}

async function deleteGame(gameId: number) {
  // Delete votes first (CASCADE should handle this, but let's be explicit)
  await query('DELETE FROM game_votes WHERE game_id = $1', [gameId]);
  
  // Delete the game
  const result = await query(`
    DELETE FROM games WHERE id = $1
    RETURNING name
  `, [gameId]);

  if (result.rows.length === 0) {
    throw new Error('Game not found');
  }

  return NextResponse.json({
    message: `Game "${result.rows[0].name}" deleted`,
    gameId
  });
}
