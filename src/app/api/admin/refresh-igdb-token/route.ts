import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const adminUserIds = [
      process.env.ADMIN_USER_ID,
      process.env.ADMIN_USER_ID_2
    ].filter(Boolean);
    
    if (!adminUserIds.includes(session.user.id)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const twitchClientId = process.env.TWITCH_CLIENT_ID;
    const twitchClientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!twitchClientId || !twitchClientSecret) {
      return NextResponse.json(
        { error: 'Twitch credentials not configured' },
        { status: 500 }
      );
    }

    console.log('Refreshing IGDB access token...');

    // Step 1: Get a new access token from Twitch
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: twitchClientId,
        client_secret: twitchClientSecret,
        grant_type: 'client_credentials'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get access token:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to refresh IGDB token' },
        { status: 500 }
      );
    }

    const tokenData = await response.json();

    // Step 2: Test the new token with IGDB API
    const testResponse = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': twitchClientId,
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'text/plain'
      },
      body: `
        search "test";
        fields name;
        limit 1;
      `
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('New token test failed:', testResponse.status, errorText);
      return NextResponse.json(
        { error: 'New IGDB token failed validation' },
        { status: 500 }
      );
    }

    console.log('✅ New IGDB token validated successfully');

    return NextResponse.json({
      success: true,
      message: 'IGDB token refreshed successfully',
      expires_in: tokenData.expires_in,
      token_preview: `${tokenData.access_token.substring(0, 8)}...`,
      instructions: {
        note: 'The new token has been generated and validated, but you need to manually update the Railway environment variable',
        command: `railway variables --set "IGDB_ACCESS_TOKEN=${tokenData.access_token}"`
      }
    });

  } catch (error) {
    console.error('Error refreshing IGDB token:', error);
    return NextResponse.json(
      { error: 'Internal server error while refreshing IGDB token' },
      { status: 500 }
    );
  }
}

// GET endpoint to check current token status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const adminUserIds = [
      process.env.ADMIN_USER_ID,
      process.env.ADMIN_USER_ID_2
    ].filter(Boolean);
    
    if (!adminUserIds.includes(session.user.id)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const clientId = process.env.IGDB_CLIENT_ID;
    const accessToken = process.env.IGDB_ACCESS_TOKEN;

    if (!clientId || !accessToken) {
      return NextResponse.json({
        configured: false,
        error: 'IGDB credentials not configured'
      });
    }

    // Test current token
    try {
      const response = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain'
        },
        body: `
          search "test";
          fields name;
          limit 1;
        `
      });

      const isValid = response.ok;
      
      return NextResponse.json({
        configured: true,
        token_valid: isValid,
        token_preview: `${accessToken.substring(0, 8)}...`,
        client_id: clientId,
        status: isValid ? 'Working' : 'Expired/Invalid'
      });

    } catch {
      return NextResponse.json({
        configured: true,
        token_valid: false,
        error: 'Failed to test token'
      });
    }

  } catch (err) {
    console.error('Error checking IGDB token status:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
