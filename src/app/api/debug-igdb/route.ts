import { NextRequest, NextResponse } from 'next/server';

interface IGDBGame {
  id: number;
  name: string;
  summary?: string;
  cover?: { image_id: string };
  involved_companies?: Array<{ company: { name: string }, developer: boolean }>;
  genres?: Array<{ name: string }>;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'minecraft';

  try {
    const clientId = process.env.IGDB_CLIENT_ID;
    const accessToken = process.env.IGDB_ACCESS_TOKEN;
    
    if (!clientId || !accessToken) {
      return NextResponse.json({ 
        error: 'IGDB credentials not configured',
        hasClientId: !!clientId,
        hasAccessToken: !!accessToken
      });
    }

    console.log('Testing IGDB with:', { clientId: clientId.substring(0, 8) + '...', query });

    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain'
      },
      body: `
        search "${query.replace(/"/g, '\\"')}";
        fields name,summary,cover.image_id,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,first_release_date,genres.name;
        where category = 0 & version_parent = null;
        limit 5;
      `
    });

    console.log('IGDB Response status:', response.status);
    console.log('IGDB Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('IGDB API Error:', errorText);
      return NextResponse.json({ 
        error: 'IGDB API request failed',
        status: response.status,
        statusText: response.statusText,
        response: errorText
      });
    }

    const games: IGDBGame[] = await response.json();
    console.log('IGDB Games received:', games.length, 'games');
    console.log('First game:', games[0]);

    return NextResponse.json({
      success: true,
      query,
      gamesCount: games.length,
      games: games.map((game: IGDBGame) => ({
        id: game.id,
        name: game.name,
        summary: game.summary ? game.summary.substring(0, 100) + '...' : '',
        cover_id: game.cover?.image_id,
        image_url: game.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg` : null,
        developer: game.involved_companies?.find(c => c.developer)?.company.name,
        genres: game.genres?.map(g => g.name).join(', ')
      }))
    });

  } catch (error) {
    console.error('Error testing IGDB:', error);
    return NextResponse.json({ 
      error: 'Failed to test IGDB API',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
