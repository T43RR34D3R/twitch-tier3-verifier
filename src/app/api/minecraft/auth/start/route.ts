import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

    // Initialize server Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Store the pending authorization in the database
    const { error } = await supabase
      .from('minecraft_auth_pending')
      .upsert({
        auth_code: authCode,
        minecraft_username: minecraftUsername,
        created_at: new Date(),
        expires_at: new Date(new Date().getTime() + 5 * 60000), // 5 minutes from now
      });

    if (error) {
      console.error('Error inserting into database:', error);
      throw new Error('Database error');
    }

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
