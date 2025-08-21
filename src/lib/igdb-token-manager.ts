import { NextResponse } from 'next/server';

interface TokenData {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface IGDBTokenManager {
  getValidToken(): Promise<string>;
  refreshToken(): Promise<string>;
  isTokenValid(token: string, clientId: string): Promise<boolean>;
}

class IGDBTokenManagerImpl implements IGDBTokenManager {
  private static instance: IGDBTokenManagerImpl;
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;
  private refreshPromise: Promise<string> | null = null;

  public static getInstance(): IGDBTokenManagerImpl {
    if (!IGDBTokenManagerImpl.instance) {
      IGDBTokenManagerImpl.instance = new IGDBTokenManagerImpl();
    }
    return IGDBTokenManagerImpl.instance;
  }

  private constructor() {
    // Initialize with current env token if available
    this.cachedToken = process.env.IGDB_ACCESS_TOKEN || null;
  }

  public async getValidToken(): Promise<string> {
    const clientId = process.env.IGDB_CLIENT_ID || process.env.TWITCH_CLIENT_ID;
    
    if (!clientId) {
      throw new Error('IGDB Client ID not configured');
    }

    // If we have a cached token and it's still valid, use it
    if (this.cachedToken && Date.now() < this.tokenExpiry - 300000) { // 5 min buffer
      // Verify token is still working
      if (await this.isTokenValid(this.cachedToken, clientId)) {
        return this.cachedToken;
      } else {
        console.log('Cached token is invalid, refreshing...');
        this.cachedToken = null;
      }
    }

    // If we already have a refresh in progress, wait for it
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    // Start refresh process
    this.refreshPromise = this.refreshToken();
    
    try {
      const newToken = await this.refreshPromise;
      this.refreshPromise = null;
      return newToken;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  public async refreshToken(): Promise<string> {
    const twitchClientId = process.env.TWITCH_CLIENT_ID;
    const twitchClientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!twitchClientId || !twitchClientSecret) {
      throw new Error('Twitch credentials not configured');
    }

    console.log('Refreshing IGDB access token...');

    try {
      // Get new access token from Twitch
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
        throw new Error('Failed to refresh IGDB token');
      }

      const tokenData: TokenData = await response.json();

      // Test the new token with IGDB API
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
        throw new Error('New IGDB token failed validation');
      }

      console.log('✅ New IGDB token validated successfully');

      // Cache the new token
      this.cachedToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);

      // Update environment variable for Railway (if Railway CLI is available)
      try {
        // Note: This won't work in production, but helps in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: New token generated but not automatically deployed to production.');
          console.log('For production, manually update the Railway environment variable:');
          console.log(`railway variables set IGDB_ACCESS_TOKEN=${tokenData.access_token}`);
        }
      } catch (envError) {
        console.warn('Could not update environment variable automatically:', envError);
      }

      return tokenData.access_token;

    } catch (error) {
      console.error('Error refreshing IGDB token:', error);
      throw error;
    }
  }

  public async isTokenValid(token: string, clientId: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain'
        },
        body: `
          search "test";
          fields name;
          limit 1;
        `
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

export const igdbTokenManager = IGDBTokenManagerImpl.getInstance();
