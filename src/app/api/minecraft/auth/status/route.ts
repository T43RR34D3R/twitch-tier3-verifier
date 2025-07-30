import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Initialize server Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if the authorization has been completed
    const { data: pendingAuth, error: pendingError } = await supabase
      .from('minecraft_auth_pending')
      .select('minecraft_username, expires_at')
      .eq('auth_code', authCode)
      .single();

    if (pendingError || !pendingAuth) {
      return NextResponse.json(
        { error: 'Invalid or expired auth code' },
        { status: 404 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(pendingAuth.expires_at);
    if (expiresAt < now) {
      // Clean up expired auth
      await supabase.from('minecraft_auth_pending').delete().eq('auth_code', authCode);
      return NextResponse.json(
        { error: 'Authorization expired' },
        { status: 404 }
      );
    }

    // Check if completed
    const { data: completedAuth, error: completedError } = await supabase
      .from('minecraft_auth_completed')
      .select('minecraft_username, twitch_username, completed_at')
      .eq('auth_code', authCode)
      .single();

    if (!completedError && completedAuth) {
      // Clean up completed auth from pending table
      await supabase.from('minecraft_auth_pending').delete().eq('auth_code', authCode);
      
      return NextResponse.json({
        twitchUsername: completedAuth.twitch_username,
        completedAt: completedAuth.completed_at
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
