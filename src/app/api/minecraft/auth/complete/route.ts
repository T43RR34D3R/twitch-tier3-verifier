import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Initialize server Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify that the auth code exists and hasn't expired
    const { data: pendingAuth, error: pendingError } = await supabase
      .from('minecraft_auth_pending')
      .select('minecraft_username, expires_at')
      .eq('auth_code', authCode)
      .single();

    if (pendingError || !pendingAuth) {
      return NextResponse.json(
        { error: 'Invalid or expired authorization code' },
        { status: 400 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(pendingAuth.expires_at);
    if (expiresAt < now) {
      return NextResponse.json(
        { error: 'Authorization code has expired' },
        { status: 400 }
      );
    }

    // Verify that the minecraft username matches
    if (pendingAuth.minecraft_username !== minecraftUsername) {
      return NextResponse.json(
        { error: 'Minecraft username mismatch' },
        { status: 400 }
      );
    }

    // Complete the authorization
    const { error: completeError } = await supabase
      .from('minecraft_auth_completed')
      .upsert({
        auth_code: authCode,
        minecraft_username: minecraftUsername,
        twitch_username: twitchUsername,
        completed_at: new Date()
      });

    if (completeError) {
      console.error('Error completing authorization:', completeError);
      throw new Error('Failed to complete authorization');
    }

    // Store the account linking for future reference
    const { error: linkError } = await supabase
      .from('minecraft_twitch_links')
      .upsert({
        minecraft_username: minecraftUsername,
        twitch_username: twitchUsername,
        linked_at: new Date(),
        updated_at: new Date()
      });

    if (linkError) {
      console.error('Error storing account link:', linkError);
      // Don't fail the request if linking storage fails
    }

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
