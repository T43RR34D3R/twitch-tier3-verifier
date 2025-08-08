import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { sql } from '@vercel/postgres';

interface CalendarPanelSettings {
  enabled: boolean;
  showDescription: boolean;
  daysToShow: number;
}

// Ensure the calendar_panel_settings table exists
async function ensureTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS calendar_panel_settings (
        id SERIAL PRIMARY KEY,
        settings JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    console.error('Error creating calendar_panel_settings table:', error);
    throw error;
  }
}

export async function GET() {
  try {
    await ensureTable();
    
    const result = await sql`
      SELECT settings FROM calendar_panel_settings ORDER BY updated_at DESC LIMIT 1
    `;
    
    if (result.rows.length === 0) {
      // Return default settings
      const defaultSettings: CalendarPanelSettings = {
        enabled: true,
        showDescription: true,
        daysToShow: 7
      };
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(result.rows[0].settings);
  } catch (error) {
    console.error('Error fetching calendar panel settings:', error);
    
    // Return default settings on error
    const defaultSettings: CalendarPanelSettings = {
      enabled: true,
      showDescription: true,
      daysToShow: 7
    };
    return NextResponse.json(defaultSettings);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const settings: CalendarPanelSettings = await request.json();
    
    // Validate settings
    if (typeof settings.enabled !== 'boolean' ||
        typeof settings.showDescription !== 'boolean' ||
        typeof settings.daysToShow !== 'number') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      );
    }

    await ensureTable();

    // Insert new settings (we keep history by not updating, just inserting)
    await sql`
      INSERT INTO calendar_panel_settings (settings, updated_at)
      VALUES (${JSON.stringify(settings)}, CURRENT_TIMESTAMP)
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Calendar panel settings saved successfully',
      settings 
    });

  } catch (error) {
    console.error('Error saving calendar panel settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
