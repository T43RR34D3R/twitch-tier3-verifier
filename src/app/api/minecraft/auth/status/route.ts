import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * Check the status of a Minecraft authorization
 * GET /api/minecraft/auth/status?code={authCode}
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authCode = searchParams.get('code');

    if (!authCode) {
      return NextResponse.json(
        { error: 'Missing auth code' },
        { status: 400 }
      );
    }

    // Check if the authorization has been completed
    const result = await sql`
      SELECT 
        mac.minecraft_username,
        mac.twitch_username,
        mac.completed_at,
        map.expires_at,
        CASE WHEN mac.completed_at IS NOT NULL THEN true ELSE false END as is_completed,
        CASE WHEN map.expires_at < NOW() THEN true ELSE false END as is_expired
      FROM minecraft_auth_pending map
      LEFT JOIN minecraft_auth_completed mac ON mac.auth_code = map.auth_code
      WHERE map.auth_code = ${authCode}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired auth code' },
        { status: 404 }
      );
    }

    const authData = result.rows[0];

    // Check if expired
    if (authData.is_expired) {
      // Clean up expired auth
      await sql`DELETE FROM minecraft_auth_pending WHERE auth_code = ${authCode}`;
      return NextResponse.json(
        { error: 'Authorization expired' },
        { status: 404 }
      );
    }

    // Check if completed
    if (authData.is_completed && authData.twitch_username) {
      // Clean up completed auth from pending table
      await sql`DELETE FROM minecraft_auth_pending WHERE auth_code = ${authCode}`;
      
      return NextResponse.json({
        twitchUsername: authData.twitch_username,
        completedAt: authData.completed_at
      });
    }

    // Still pending
    return NextResponse.json(
      { message: 'Authorization pending' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error checking Minecraft auth status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
