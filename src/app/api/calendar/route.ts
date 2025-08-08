import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { queryRows, queryRow } from '../../../lib/railway-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let whereClause = '';
    let params: (string | number)[] = [];

    if (month && year) {
      whereClause = 'WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2';
      params = [parseInt(month), parseInt(year)];
    }

    const events = await queryRows(
      `SELECT 
        id, 
        date, 
        title, 
        description, 
        image_url, 
        background_color, 
        text_color, 
        is_all_day, 
        start_time, 
        end_time, 
        created_by, 
        created_at, 
        updated_at
      FROM calendar_events 
      ${whereClause}
      ORDER BY date ASC, start_time ASC NULLS LAST`,
      params
    );

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminCheck = await queryRows(
      'SELECT id FROM admin_users WHERE user_id = $1 AND is_active = true',
      [session.user.id]
    );

    if (!adminCheck || adminCheck.length === 0) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const {
      date,
      title,
      description,
      image_url,
      background_color,
      text_color,
      is_all_day,
      start_time,
      end_time
    } = await request.json();

    if (!date || !title) {
      return NextResponse.json(
        { error: 'Date and title are required' },
        { status: 400 }
      );
    }

    const result = await queryRow(
      `INSERT INTO calendar_events (
        date, title, description, image_url, background_color, text_color,
        is_all_day, start_time, end_time, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        date,
        title,
        description || null,
        image_url || null,
        background_color || '#6366f1',
        text_color || '#ffffff',
        is_all_day !== false,
        start_time || null,
        end_time || null,
        session.user.id
      ]
    );

    return NextResponse.json({ event: result });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminCheck = await queryRows(
      'SELECT id FROM admin_users WHERE user_id = $1 AND is_active = true',
      [session.user.id]
    );

    if (!adminCheck || adminCheck.length === 0) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const {
      id,
      date,
      title,
      description,
      image_url,
      background_color,
      text_color,
      is_all_day,
      start_time,
      end_time
    } = await request.json();

    if (!id || !date || !title) {
      return NextResponse.json(
        { error: 'ID, date, and title are required' },
        { status: 400 }
      );
    }

    const result = await queryRow(
      `UPDATE calendar_events SET
        date = $1,
        title = $2,
        description = $3,
        image_url = $4,
        background_color = $5,
        text_color = $6,
        is_all_day = $7,
        start_time = $8,
        end_time = $9,
        updated_by = $10,
        updated_at = NOW()
      WHERE id = $11
      RETURNING *`,
      [
        date,
        title,
        description || null,
        image_url || null,
        background_color || '#6366f1',
        text_color || '#ffffff',
        is_all_day !== false,
        start_time || null,
        end_time || null,
        session.user.id,
        id
      ]
    );

    if (!result) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event: result });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminCheck = await queryRows(
      'SELECT id FROM admin_users WHERE user_id = $1 AND is_active = true',
      [session.user.id]
    );

    if (!adminCheck || adminCheck.length === 0) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const result = await queryRow(
      'DELETE FROM calendar_events WHERE id = $1 RETURNING *',
      [id]
    );

    if (!result) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}
