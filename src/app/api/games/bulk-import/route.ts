import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/railway-db';

interface IGDBGame {
  id: number;
  name: string;
  cover?: {
    image_id: string;
  };
  summary?: string;
  involved_companies?: Array<{
    company: {
      name: string;
    };
    developer: boolean;
    publisher: boolean;
  }>;
  first_release_date?: number;
  genres?: Array<{
    name: string;
  }>;
  rating?: number;
  rating_count?: number;
  platforms?: Array<{
    name: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only allow admin users (you can modify this check)
    const isAdmin = session.user.email === process.env.ADMIN_EMAIL; // Set ADMIN_EMAIL in env
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      limit = 1000, 
      minRating = 70, 
      minRatingCount = 10,
      yearFrom = 2010 
    } = body;

    console.log(`Starting bulk import of up to ${limit} games from IGDB...`);

    if (!process.env.IGDB_CLIENT_ID || !process.env.IGDB_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'IGDB credentials not configured' },
        { status: 503 }
      );
    }

    let offset = 0;
    const batchSize = 500; // IGDB max limit per request
    let totalImported = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    while (offset < limit) {
      const currentBatchSize = Math.min(batchSize, limit - offset);
      
      console.log(`Fetching batch: offset=${offset}, size=${currentBatchSize}`);

      try {
        // Fetch games from IGDB with filters for quality
        const response = await fetch('https://api.igdb.com/v4/games', {
          method: 'POST',
          headers: {
            'Client-ID': process.env.IGDB_CLIENT_ID!,
            'Authorization': `Bearer ${process.env.IGDB_ACCESS_TOKEN!}`,
            'Content-Type': 'text/plain'
          },
          body: `
            fields name,summary,cover.image_id,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,first_release_date,genres.name,platforms.name,rating,rating_count;
            where category = 0 & version_parent = null & rating >= ${minRating} & rating_count >= ${minRatingCount} & first_release_date >= ${Math.floor(new Date(yearFrom, 0, 1).getTime() / 1000)};
            sort rating desc;
            limit ${currentBatchSize};
            offset ${offset};
          `
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('IGDB API error:', response.status, errorText);
          throw new Error(`IGDB API request failed: ${response.status} ${errorText}`);
        }

        const games: IGDBGame[] = await response.json();
        
        if (games.length === 0) {
          console.log('No more games found, ending import');
          break;
        }

        console.log(`Processing ${games.length} games from this batch...`);

        // Process each game
        for (const game of games) {
          try {
            // Check if game already exists (by name)
            const existingGame = await query(
              'SELECT id FROM games WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))',
              [game.name]
            );

            if (existingGame.rows.length > 0) {
              totalSkipped++;
              continue;
            }

            // Extract game data
            const developer = game.involved_companies?.find(c => c.developer)?.company.name;
            const publisher = game.involved_companies?.find(c => c.publisher)?.company.name;
            const imageUrl = game.cover?.image_id 
              ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg` 
              : null;
            const releaseDate = game.first_release_date 
              ? new Date(game.first_release_date * 1000).toISOString().split('T')[0] 
              : null;
            const genres = game.genres?.map(g => g.name).join(', ') || null;

            // Insert into database
            await query(`
              INSERT INTO games (
                name, 
                description, 
                image_url, 
                genre, 
                developer, 
                publisher, 
                release_date,
                added_by_user_id, 
                added_by_username,
                is_approved,
                vote_count
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
              game.name,
              game.summary?.substring(0, 500), // Limit description length
              imageUrl,
              genres,
              developer,
              publisher,
              releaseDate,
              session.user.id,
              'IGDB Import',
              true, // Auto-approve imported games
              0
            ]);

            totalImported++;

            // Log progress every 50 games
            if (totalImported % 50 === 0) {
              console.log(`Imported ${totalImported} games so far...`);
            }

          } catch (gameError) {
            console.error(`Error importing game "${game.name}":`, gameError);
            errors.push(`Failed to import "${game.name}": ${gameError}`);
          }
        }

        offset += games.length;

        // Add a small delay to be nice to IGDB API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (batchError) {
        console.error(`Error processing batch at offset ${offset}:`, batchError);
        errors.push(`Batch error at offset ${offset}: ${batchError}`);
        break; // Stop on batch errors
      }
    }

    console.log(`Bulk import completed. Imported: ${totalImported}, Skipped: ${totalSkipped}, Errors: ${errors.length}`);

    return NextResponse.json({
      success: true,
      message: `Bulk import completed successfully`,
      stats: {
        imported: totalImported,
        skipped: totalSkipped,
        errors: errors.length,
        totalProcessed: totalImported + totalSkipped
      },
      errors: errors.slice(0, 10) // Only show first 10 errors
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Failed to bulk import games', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to check import status/stats
export async function GET() {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_games,
        COUNT(*) FILTER (WHERE added_by_username = 'IGDB Import') as igdb_imported_games,
        COUNT(*) FILTER (WHERE is_approved = true) as approved_games,
        MIN(created_at) as first_game_date,
        MAX(created_at) as latest_game_date
      FROM games
    `);

    return NextResponse.json({
      success: true,
      stats: stats.rows[0]
    });

  } catch (error) {
    console.error('Error fetching import stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch import stats' },
      { status: 500 }
    );
  }
}
