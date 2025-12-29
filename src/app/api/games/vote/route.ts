import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/railway-db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }

    // Check if game exists and is approved
    const gameCheck = await query(
      'SELECT id, name, is_approved FROM games WHERE id = $1',
      [gameId]
    );

    if (gameCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    if (!gameCheck.rows[0].is_approved) {
      return NextResponse.json(
        { error: 'Game is not approved for voting' },
        { status: 403 }
      );
    }

    // Check if user has already voted for this game
    const existingVote = await query(
      'SELECT id FROM game_votes WHERE user_id = $1 AND game_id = $2',
      [session.user.id, gameId]
    );

    if (existingVote.rows.length > 0) {
      return NextResponse.json(
        { error: 'You have already voted for this game' },
        { status: 409 }
      );
    }

    // Check if user has reached the vote limit (3 votes)
    const voteCount = await query(
      'SELECT COUNT(*) as count FROM game_votes WHERE user_id = $1',
      [session.user.id]
    );

    const currentVotes = parseInt(voteCount.rows[0].count);
    if (currentVotes >= 3) {
      return NextResponse.json(
        { error: 'You have reached the maximum of 3 votes. Please remove a vote before adding a new one.' },
        { status: 403 }
      );
    }

    // Add the vote
    await query(`
      INSERT INTO game_votes (game_id, user_id, username, voted_at)
      VALUES ($1, $2, $3, NOW())
    `, [gameId, session.user.id, session.user.name || 'Unknown']);

    // Update the vote count in the games table
    await query(`
      UPDATE games 
      SET vote_count = (
        SELECT COUNT(*) FROM game_votes WHERE game_id = $1
      )
      WHERE id = $1
    `, [gameId]);

    // Update or insert voting user record
    // Note: Column names say "twitch_*" for historical reasons, but they store any OAuth provider's data
    await query(`
      INSERT INTO voting_users (
        twitch_user_id, 
        twitch_username, 
        twitch_display_name,
        last_vote_at, 
        total_votes,
        last_login_at
      ) VALUES ($1, $2, $3, NOW(), 1, NOW())
      ON CONFLICT (twitch_user_id) 
      DO UPDATE SET 
        last_vote_at = NOW(),
        total_votes = voting_users.total_votes + 1,
        last_login_at = NOW()
    `, [session.user.id, session.user.name || 'Unknown', session.user.name || 'Unknown']);

    return NextResponse.json({
      message: 'Vote recorded successfully',
      game: gameCheck.rows[0].name
    });

  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }

    // Check if vote exists
    const existingVote = await query(
      'SELECT id FROM game_votes WHERE user_id = $1 AND game_id = $2',
      [session.user.id, gameId]
    );

    if (existingVote.rows.length === 0) {
      return NextResponse.json(
        { error: 'No vote found to remove' },
        { status: 404 }
      );
    }

    // Remove the vote
    await query(
      'DELETE FROM game_votes WHERE user_id = $1 AND game_id = $2',
      [session.user.id, gameId]
    );

    // Update the vote count in the games table
    await query(`
      UPDATE games 
      SET vote_count = (
        SELECT COUNT(*) FROM game_votes WHERE game_id = $1
      )
      WHERE id = $1
    `, [gameId]);

    // Update voting user record
    await query(`
      UPDATE voting_users 
      SET 
        total_votes = GREATEST(total_votes - 1, 0),
        updated_at = NOW()
      WHERE twitch_user_id = $1
    `, [session.user.id]);

    return NextResponse.json({
      message: 'Vote removed successfully'
    });

  } catch (error) {
    console.error('Error removing vote:', error);
    return NextResponse.json(
      { error: 'Failed to remove vote' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if user has voted for specific games
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const gameIds = searchParams.get('gameIds')?.split(',').map(id => parseInt(id));

    if (!gameIds || gameIds.length === 0) {
      // Get total vote count for user
      const voteCountResult = await query(
        'SELECT COUNT(*) as count FROM game_votes WHERE user_id = $1',
        [session.user.id]
      );
      return NextResponse.json({ 
        votedGames: [],
        totalVotes: parseInt(voteCountResult.rows[0].count)
      });
    }

    const placeholders = gameIds.map((_, index) => `$${index + 2}`).join(',');
    const result = await query(`
      SELECT game_id 
      FROM game_votes 
      WHERE user_id = $1 AND game_id IN (${placeholders})
    `, [session.user.id, ...gameIds]);

    const votedGameIds = result.rows.map(row => row.game_id);

    // Also get total vote count for user
    const voteCountResult = await query(
      'SELECT COUNT(*) as count FROM game_votes WHERE user_id = $1',
      [session.user.id]
    );

    return NextResponse.json({
      votedGames: votedGameIds,
      totalVotes: parseInt(voteCountResult.rows[0].count)
    });

  } catch (error) {
    console.error('Error checking votes:', error);
    return NextResponse.json(
      { error: 'Failed to check votes' },
      { status: 500 }
    );
  }
}
