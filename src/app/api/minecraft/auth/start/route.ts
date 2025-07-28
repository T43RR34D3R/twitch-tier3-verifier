import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { randomBytes } from 'crypto';

interface StartAuthRequest {
  minecraftUsername: string;
}

/**
 * Start the Twitch authorization process for a Minecraft player
 * POST /api/minecraft/auth/start
 */
export async function POST(request: NextRequest) {
  try {
    const body: StartAuthRequest = await request.json();
    const { minecraftUsername } = body;

    if (!minecraftUsername || typeof minecraftUsername !== 'string') {
      return NextResponse.json(
        { error: 'Invalid minecraft username' },
        { status: 400 }
      );
    }

    // Generate a unique authorization code
    const authCode = randomBytes(32).toString('hex');
    
    // Create authorization URL that will redirect to our auth flow
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const authUrl = `${baseUrl}/minecraft-auth?code=${authCode}&minecraft=${encodeURIComponent(minecraftUsername)}`;

    // Store the pending authorization in database
    await sql`
      INSERT INTO minecraft_auth_pending (auth_code, minecraft_username, created_at, expires_at)
      VALUES (${authCode}, ${minecraftUsername}, NOW(), NOW() + INTERVAL '5 minutes')
      ON CONFLICT (auth_code) DO UPDATE SET
        minecraft_username = ${minecraftUsername},
        created_at = NOW(),
        expires_at = NOW() + INTERVAL '5 minutes'
    `;

    return NextResponse.json({
      authUrl,
      authCode,
      expiresIn: 300 // 5 minutes in seconds
    });

  } catch (error) {
    console.error('Error starting Minecraft auth:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
