/**
 * Validates a Twitch access token and returns user information
 * @param token - The Twitch access token to validate
 * @returns Promise<TwitchUser | null> - User info if valid, null if invalid
 */
export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email?: string;
  created_at: string;
}

export async function validateTwitchToken(token: string): Promise<TwitchUser | null> {
  try {
    // First validate the token
    const validateResponse = await fetch('https://id.twitch.tv/oauth2/validate', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!validateResponse.ok) {
      console.error('Token validation failed:', validateResponse.status);
      return null;
    }

    const validationData = await validateResponse.json();
    
    // If token is valid, get user information
    const userResponse = await fetch('https://api.twitch.tv/helix/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    });

    if (!userResponse.ok) {
      console.error('User fetch failed:', userResponse.status);
      return null;
    }

    const userData = await userResponse.json();
    
    if (!userData.data || userData.data.length === 0) {
      console.error('No user data returned');
      return null;
    }

    return userData.data[0] as TwitchUser;
  } catch (error) {
    console.error('Error validating Twitch token:', error);
    return null;
  }
}

/**
 * Get user subscriptions for a broadcaster
 * @param token - The Twitch access token
 * @param broadcasterId - The broadcaster's Twitch ID
 * @returns Promise<any[]> - Array of subscription data
 */
export async function getUserSubscriptions(token: string, broadcasterId: string): Promise<any[]> {
  try {
    const response = await fetch(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${broadcasterId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch subscriptions:', response.status);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return [];
  }
}

/**
 * Get channel information
 * @param token - The Twitch access token
 * @param broadcasterId - The broadcaster's Twitch ID
 * @returns Promise<any | null> - Channel information
 */
export async function getChannelInfo(token: string, broadcasterId: string): Promise<any | null> {
  try {
    const response = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${broadcasterId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch channel info:', response.status);
      return null;
    }

    const data = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error('Error fetching channel info:', error);
    return null;
  }
}

/**
 * Get stream information
 * @param token - The Twitch access token
 * @param broadcasterId - The broadcaster's Twitch ID
 * @returns Promise<any | null> - Stream information
 */
export async function getStreamInfo(token: string, broadcasterId: string): Promise<any | null> {
  try {
    const response = await fetch(`https://api.twitch.tv/helix/streams?user_id=${broadcasterId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch stream info:', response.status);
      return null;
    }

    const data = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error('Error fetching stream info:', error);
    return null;
  }
}
