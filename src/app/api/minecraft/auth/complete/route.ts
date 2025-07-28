import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

interface CompleteAuthRequest {
  authCode: string;
  twitchUsername: string;
  minecraftUsername: string;
}

/**
 * Complete the Minecraft authorization process
 * POST /api/minecraft/auth/complete
 */
export async function POST(request: NextRequest) {
  try {
    const body: CompleteAuthRequest = await request.json();
    const { authCode, twitchUsername, minecraftUsername } = body;

    if (!authCode || !twitchUsername || !minecraftUsername) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify that the auth code exists and hasn't expired
    const pendingResult = await sql`
      SELECT minecraft_username, expires_at
      FROM minecraft_auth_pending
      WHERE auth_code = ${authCode}
      AND expires_at > NOW()
    `;

    if (pendingResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired authorization code' },
        { status: 400 }
      );
    }

    const pendingAuth = pendingResult.rows[0];

    // Verify that the minecraft username matches
    if (pendingAuth.minecraft_username !== minecraftUsername) {
      return NextResponse.json(
        { error: 'Minecraft username mismatch' },
        { status: 400 }
      );
    }

    // Complete the authorization
    await sql`
      INSERT INTO minecraft_auth_completed (
        auth_code, 
        minecraft_username, 
        twitch_username, 
        completed_at
      )
      VALUES (
        ${authCode}, 
        ${minecraftUsername}, 
        ${twitchUsername}, 
        NOW()
      )
      ON CONFLICT (auth_code) DO UPDATE SET
        twitch_username = ${twitchUsername},
        completed_at = NOW()
    `;

    // Optional: Store the account linking for future reference
    await sql`
      INSERT INTO minecraft_twitch_links (
        minecraft_username,
        twitch_username,
        linked_at,
        updated_at
      )
      VALUES (
        ${minecraftUsername},
        ${twitchUsername},
        NOW(),
        NOW()
      )
      ON CONFLICT (minecraft_username) DO UPDATE SET
        twitch_username = ${twitchUsername},
        updated_at = NOW()
    `;

    return NextResponse.json({
      success: true,
      message: 'Authorization completed successfully',
      minecraftUsername,
      twitchUsername
    });

  } catch (error) {
    console.error('Error completing Minecraft auth:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
