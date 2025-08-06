import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Types for different game sources

interface IGDBGame {
  id: number;
  name: string;
  cover?: {
    url: string;
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
    const sources = searchParams.get('sources')?.split(',') || ['steam', 'rawg'];

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const results: GameSearchResult[] = [];

    // Search Steam if requested
    if (sources.includes('steam')) {
      try {
        const steamResults = await searchSteam(query);
        results.push(...steamResults);
      } catch (error) {
        console.warn('Steam search failed:', error);
      }
    }

    // Search RAWG (free game database) if requested
    if (sources.includes('rawg')) {
      try {
        const rawgResults = await searchRAWG(query);
        results.push(...rawgResults);
      } catch (error) {
        console.warn('RAWG search failed:', error);
      }
    }

    // Search IGDB if requested and API key is available
    if (sources.includes('igdb') && process.env.IGDB_CLIENT_ID) {
      try {
        const igdbResults = await searchIGDB(query);
        results.push(...igdbResults);
      } catch (error) {
        console.warn('IGDB search failed:', error);
      }
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

// Search Steam using their web API
async function searchSteam(query: string): Promise<GameSearchResult[]> {
  const response = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`);
  
  if (!response.ok) {
    throw new Error('Steam API request failed');
  }

  const data = await response.json();
  
  return data.items?.slice(0, 10).map((item: Record<string, unknown>) => ({
    source: 'steam' as const,
    id: (item.id as string | number).toString(),
    name: item.name as string,
    description: item.tiny_image ? undefined : item.name as string, // Steam search doesn't include descriptions
    image_url: item.tiny_image as string | undefined,
    source_url: `https://store.steampowered.com/app/${item.id}/`
  })) || [];
}

// Search RAWG (free game database)
async function searchRAWG(query: string): Promise<GameSearchResult[]> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    console.warn('RAWG API key not configured');
    return [];
  }

  const response = await fetch(
    `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=10&ordering=-rating`
  );
  
  if (!response.ok) {
    throw new Error('RAWG API request failed');
  }

  const data = await response.json();
  
  return data.results?.map((game: Record<string, unknown>) => ({
    source: 'rawg' as const,
    id: (game.id as string | number).toString(),
    name: game.name as string,
    description: game.description_raw ? (game.description_raw as string).substring(0, 200) + '...' : undefined,
    image_url: game.background_image as string | undefined,
    developer: (game.developers as Record<string, unknown>[] | undefined)?.[0]?.name as string | undefined,
    publisher: (game.publishers as Record<string, unknown>[] | undefined)?.[0]?.name as string | undefined,
    release_date: game.released as string | undefined,
    genre: (game.genres as Record<string, unknown>[] | undefined)?.map((g: Record<string, unknown>) => g.name as string).join(', '),
    source_url: `https://rawg.io/games/${game.slug as string}`
  })) || [];
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
      'Content-Type': 'application/json'
    },
    body: `
      search "${query}";
      fields name,summary,cover.url,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,first_release_date,genres.name;
      limit 10;
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
      image_url: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : undefined,
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
