import { NextRequest, NextResponse } from 'next/server';

/**
 * Check if a Twitch user is currently streaming
 * GET /api/twitch/stream-status?username={twitchUsername}
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Missing username parameter' },
        { status: 400 }
      );
    }

    // Get an app access token for Twitch API calls
    const appToken = await getAppAccessToken();
    if (!appToken) {
      return NextResponse.json(
        { error: 'Failed to get Twitch API access' },
        { status: 500 }
      );
    }

    // First, get the user ID from the username
    const userResponse = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
      headers: {
        'Authorization': `Bearer ${appToken}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    });

    if (!userResponse.ok) {
      if (userResponse.status === 404) {
        return NextResponse.json(
          { error: 'Twitch user not found' },
          { status: 404 }
        );
      }
      throw new Error(`Twitch API error: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    if (!userData.data || userData.data.length === 0) {
      return NextResponse.json(
        { error: 'Twitch user not found' },
        { status: 404 }
      );
    }

    const userId = userData.data[0].id;

    // Check if the user is currently streaming
    const streamResponse = await fetch(`https://api.twitch.tv/helix/streams?user_id=${userId}`, {
      headers: {
        'Authorization': `Bearer ${appToken}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    });

    if (!streamResponse.ok) {
      throw new Error(`Twitch streams API error: ${streamResponse.status}`);
    }

    const streamData = await streamResponse.json();
    
    // If no stream data, user is not live
    if (!streamData.data || streamData.data.length === 0) {
      return NextResponse.json(
        { error: 'User is not currently streaming' },
        { status: 404 }
      );
    }

    const stream = streamData.data[0];

    // User is live, return stream information
    return NextResponse.json({
      isLive: true,
      username: stream.user_login,
      displayName: stream.user_name,
      title: stream.title,
      game: stream.game_name,
      viewers: stream.viewer_count,
      startedAt: stream.started_at,
      thumbnailUrl: stream.thumbnail_url,
      language: stream.language
    });

  } catch (error) {
    console.error('Error checking stream status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get an app access token for Twitch API calls
 * This doesn't require user authentication
 */
async function getAppAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      console.error('Failed to get app access token:', response.status);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting app access token:', error);
    return null;
  }
}
