import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { query } from '@/lib/railway-db';

interface CalendarPanelSettings {
  enabled: boolean;
  showDescription: boolean;
  daysToShow: number;
}

// Reuse the same admin check style as customization-settings
const isUserAdmin = (userId?: string) => {
  const hardcodedAdminIds = ['441862265', '269187200'];
  const envAdmin = userId === process.env.ADMIN_USER_ID || userId === process.env.ADMIN_USER_ID_2;
  const hardcodedAdmin = hardcodedAdminIds.includes(userId || '');
  return envAdmin || hardcodedAdmin;
};

// Ensure the calendar_panel_settings table exists (in the same DB as other customization data)
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS calendar_panel_settings (
      id SERIAL PRIMARY KEY,
      settings JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function GET() {
  try {
    await ensureTable();

    const result = await query(
      'SELECT settings FROM calendar_panel_settings ORDER BY updated_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      const defaultSettings: CalendarPanelSettings = {
        enabled: true,
        showDescription: true,
        daysToShow: 7,
      };
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(result.rows[0].settings);
  } catch (error) {
    console.error('Error fetching calendar panel settings:', error);
    const fallback: CalendarPanelSettings = {
      enabled: true,
      showDescription: true,
      daysToShow: 7,
    };
    return NextResponse.json(fallback);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth like other admin customization endpoints
    const token = await getToken({ req: request });
    if (!token || !isUserAdmin(token.sub)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const settings: CalendarPanelSettings = await request.json();

    if (
      typeof settings.enabled !== 'boolean' ||
      typeof settings.showDescription !== 'boolean' ||
      typeof settings.daysToShow !== 'number'
    ) {
      return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 });
    }

    await ensureTable();

    // Upsert by inserting a new versioned row (keep history like other endpoints may)
    await query(
      'INSERT INTO calendar_panel_settings (settings, updated_at) VALUES ($1, NOW())',
      [JSON.stringify(settings)]
    );

    return NextResponse.json({
      success: true,
      message: 'Calendar panel settings saved successfully',
      settings,
    });
  } catch (error) {
    console.error('Error saving calendar panel settings:', error);
    return NextResponse.json({ error: 'Failed to save calendar panel settings' }, { status: 500 });
  }
}
