import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/railway-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'vote_count'; // vote_count, created_at, name
    const order = searchParams.get('order') || 'DESC';

    let sql = `
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
        g.added_by_username,
        g.is_approved,
        g.is_featured,
        g.created_at,
        COUNT(gv.id) as current_vote_count
      FROM games g
      LEFT JOIN game_votes gv ON g.id = gv.game_id
      WHERE g.is_approved = true
    `;

    const params: unknown[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      sql += ` AND (g.name ILIKE $${paramCount} OR g.description ILIKE $${paramCount} OR g.genre ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    sql += ` GROUP BY g.id`;
    
    // Add sorting
    const validSortFields = ['vote_count', 'created_at', 'name', 'current_vote_count'];
    const validOrder = ['ASC', 'DESC'];
    
    if (validSortFields.includes(sortBy) && validOrder.includes(order.toUpperCase())) {
      if (sortBy === 'current_vote_count') {
        sql += ` ORDER BY COUNT(gv.id) ${order.toUpperCase()}`;
      } else {
        sql += ` ORDER BY g.${sortBy} ${order.toUpperCase()}`;
      }
    } else {
      sql += ` ORDER BY COUNT(gv.id) DESC`;
    }

    // Add pagination
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    params.push(offset);

    console.log('Executing SQL:', sql);
    console.log('With params:', params);

    const result = await query(sql, params);

    // Also get total count for pagination
    let countSql = `
      SELECT COUNT(*) as total
      FROM games g
      WHERE g.is_approved = true
    `;
    
    const countParams: unknown[] = [];
    if (search) {
      countSql += ` AND (g.name ILIKE $1 OR g.description ILIKE $1 OR g.genre ILIKE $1)`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0]?.total || '0');

    return NextResponse.json({
      games: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
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

    const body = await request.json();
    const { 
      name, 
      description, 
      steam_url, 
      steam_id,
      image_url,
      genre,
      developer,
      publisher,
      release_date 
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Game name is required' },
        { status: 400 }
      );
    }

    // Improved duplicate detection
    const normalizedName = name.trim().toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    
    // Check for exact name matches (case insensitive)
    const exactMatch = await query(
      'SELECT id, name FROM games WHERE LOWER(REGEXP_REPLACE(TRIM(name), \'[^a-zA-Z0-9\\s]\', \'\', \'g\')) = $1',
      [normalizedName]
    );
    
    if (exactMatch.rows.length > 0) {
      return NextResponse.json(
        { error: `A game named "${exactMatch.rows[0].name}" already exists in the voting list.` },
        { status: 409 }
      );
    }
    
    // Check for Steam ID duplicates if provided
    if (steam_id) {
      const steamMatch = await query(
        'SELECT id, name FROM games WHERE steam_id = $1',
        [steam_id]
      );
      
      if (steamMatch.rows.length > 0) {
        return NextResponse.json(
          { error: `This game is already in the voting list as "${steamMatch.rows[0].name}".` },
          { status: 409 }
        );
      }
    }
    

    // Insert new game
    const insertResult = await query(`
      INSERT INTO games (
        name, 
        description, 
        steam_id, 
        steam_url, 
        image_url, 
        genre, 
        developer, 
        publisher, 
        release_date, 
        added_by_user_id, 
        added_by_username,
        is_approved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      name,
      description,
      steam_id,
      steam_url,
      image_url,
      genre,
      developer,
      publisher,
      release_date,
      session.user.id,
      session.user.name || 'Unknown',
      true // Auto-approve for now, can add moderation later
    ]);

    const newGame = insertResult.rows[0];

    return NextResponse.json({
      message: 'Game added successfully',
      game: newGame
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding game:', error);
    return NextResponse.json(
      { error: 'Failed to add game' },
      { status: 500 }
    );
  }
}
