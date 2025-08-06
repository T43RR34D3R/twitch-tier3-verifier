import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/railway-db';

export async function GET() {
  try {
    // Get all games in the database
    const result = await query(`
      SELECT 
        g.id,
        g.name,
        g.description,
        g.image_url,
        g.genre,
        g.developer,
        g.publisher,
        g.added_by_username,
        g.is_approved,
        g.created_at,
        COUNT(gv.id) as vote_count
      FROM games g
      LEFT JOIN game_votes gv ON g.id = gv.game_id
      GROUP BY g.id, g.name, g.description, g.image_url, g.genre, g.developer, g.publisher, g.added_by_username, g.is_approved, g.created_at
      ORDER BY g.created_at DESC
      LIMIT 20
    `);

    // Get total count
    const countResult = await query('SELECT COUNT(*) as total FROM games');
    const total = parseInt(countResult.rows[0]?.total || '0');

    return NextResponse.json({
      success: true,
      totalGames: total,
      games: result.rows.map((game: Record<string, unknown>) => ({
        id: game.id,
        name: game.name,
        description: game.description ? (game.description as string).substring(0, 100) + ((game.description as string).length > 100 ? '...' : '') : '',
        image_url: game.image_url,
        genre: game.genre,
        developer: game.developer,
        publisher: game.publisher,
        added_by: game.added_by_username,
        is_approved: game.is_approved,
        vote_count: parseInt((game.vote_count as string) || '0'),
        created_at: game.created_at
      }))
    });

  } catch (error) {
    console.error('Error checking games database:', error);
    return NextResponse.json({ 
      error: 'Failed to check games database',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Allow deleting duplicate games
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  try {
    if (action === 'clear-duplicates') {
      // Find and remove duplicate games (keeping the earliest one)
      const duplicatesResult = await query(`
        WITH duplicate_games AS (
          SELECT 
            id,
            name,
            ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(name)) ORDER BY created_at ASC) as rn
          FROM games
        )
        SELECT id, name FROM duplicate_games WHERE rn > 1
      `);

      if (duplicatesResult.rows.length > 0) {
        const duplicateIds = duplicatesResult.rows.map((row: Record<string, unknown>) => row.id);
        
        // Delete votes for duplicate games first
        await query('DELETE FROM game_votes WHERE game_id = ANY($1)', [duplicateIds]);
        
        // Delete duplicate games
        await query('DELETE FROM games WHERE id = ANY($1)', [duplicateIds]);

        return NextResponse.json({
          success: true,
          message: `Removed ${duplicatesResult.rows.length} duplicate games`,
          removedGames: duplicatesResult.rows
        });
      } else {
        return NextResponse.json({
          success: true,
          message: 'No duplicate games found'
        });
      }
    } else if (action === 'clear-all') {
      // Clear all games and votes (be careful!)
      await query('DELETE FROM game_votes');
      await query('DELETE FROM games');
      
      return NextResponse.json({
        success: true,
        message: 'All games and votes cleared'
      });
    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use ?action=clear-duplicates or ?action=clear-all' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error managing games database:', error);
    return NextResponse.json({ 
      error: 'Failed to manage games database',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
