import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Types for different game sources

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

interface GameSearchResult {
  source: 'steam' | 'igdb' | 'rawg' | 'manual';
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  developer?: string;
  publisher?: string;
  release_date?: string;
  genre?: string;
  source_url?: string;
}

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
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const results: GameSearchResult[] = [];

    // Only search IGDB if API key is available
    if (process.env.IGDB_CLIENT_ID && process.env.IGDB_ACCESS_TOKEN) {
      try {
        const igdbResults = await searchIGDB(query);
        results.push(...igdbResults);
      } catch (error) {
        console.warn('IGDB search failed:', error);
        return NextResponse.json(
          { error: 'Game search service temporarily unavailable. Please try adding the game manually.' },
          { status: 503 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Game search service not configured. Please add the game manually.' },
        { status: 503 }
      );
    }

    // Remove duplicates based on name similarity
    const uniqueResults = removeDuplicates(results);

    // Limit results to prevent overwhelming the user
    const limitedResults = uniqueResults.slice(0, 20);

    return NextResponse.json({
      games: limitedResults,
      total: limitedResults.length
    });

  } catch (error) {
    console.error('Error searching games:', error);
    return NextResponse.json(
      { error: 'Failed to search games' },
      { status: 500 }
    );
  }
}

// Search IGDB (requires API key and OAuth)
async function searchIGDB(query: string): Promise<GameSearchResult[]> {
  const clientId = process.env.IGDB_CLIENT_ID;
  const accessToken = process.env.IGDB_ACCESS_TOKEN;
  
  if (!clientId || !accessToken) {
    console.warn('IGDB credentials not configured');
    return [];
  }

  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'text/plain'
    },
    body: `
      search "${query.replace(/"/g, '\\"')}";
      fields name,summary,cover.image_id,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,first_release_date,genres.name,platforms.name,rating,rating_count;
      where category = 0 & version_parent = null;
      limit 20;
    `
  });

  if (!response.ok) {
    throw new Error('IGDB API request failed');
  }

  const games: IGDBGame[] = await response.json();
  
  return games.map((game) => {
    const developer = game.involved_companies?.find(c => c.developer)?.company.name;
    const publisher = game.involved_companies?.find(c => c.publisher)?.company.name;
    
    return {
      source: 'igdb' as const,
      id: game.id.toString(),
      name: game.name,
      description: game.summary,
      image_url: game.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg` : undefined,
      developer,
      publisher,
      release_date: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString().split('T')[0] : undefined,
      genre: game.genres?.map(g => g.name).join(', ')
    };
  });
}

// Remove duplicate games based on name similarity
function removeDuplicates(games: GameSearchResult[]): GameSearchResult[] {
  const seen = new Set<string>();
  const unique: GameSearchResult[] = [];

  for (const game of games) {
    const normalizedName = game.name.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    if (!seen.has(normalizedName)) {
      seen.add(normalizedName);
      unique.push(game);
    }
  }

  return unique;
}

// POST endpoint for manually adding a game
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
    const { name, description, image_url, developer, publisher, genre, release_date } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Game name is required and must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Create a manual game entry result
    const manualGame: GameSearchResult = {
      source: 'manual',
      id: `manual-${Date.now()}`,
      name: name.trim(),
      description: description?.trim(),
      image_url: image_url?.trim(),
      developer: developer?.trim(),
      publisher: publisher?.trim(),
      genre: genre?.trim(),
      release_date: release_date
    };

    return NextResponse.json({
      game: manualGame,
      message: 'Manual game entry created'
    });

  } catch (error) {
    console.error('Error creating manual game entry:', error);
    return NextResponse.json(
      { error: 'Failed to create manual game entry' },
      { status: 500 }
    );
  }
}
