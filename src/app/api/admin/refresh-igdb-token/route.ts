import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { igdbTokenManager } from '@/lib/igdb-token-manager';

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

    try {
      // Use the token manager to refresh the token
      const newToken = await igdbTokenManager.refreshToken();
      
      return NextResponse.json({
        success: true,
        message: 'IGDB token refreshed successfully',
        token_preview: `${newToken.substring(0, 8)}...`,
        instructions: {
          note: 'The new token has been generated and validated. For production deployment, update the Railway environment variable:',
          command: `railway variables set IGDB_ACCESS_TOKEN=${newToken}`,
          auto_refresh: 'The application will now automatically use this token and refresh it when needed.'
        }
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to refresh IGDB token' },
        { status: 500 }
      );
    }

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

    const clientId = process.env.IGDB_CLIENT_ID || process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({
        configured: false,
        error: 'IGDB credentials not configured'
      });
    }

    // Test current token using the token manager
    try {
      const validToken = await igdbTokenManager.getValidToken();
      const isValid = await igdbTokenManager.isTokenValid(validToken, clientId);
      
      return NextResponse.json({
        configured: true,
        token_valid: isValid,
        token_preview: `${validToken.substring(0, 8)}...`,
        client_id: clientId,
        status: isValid ? 'Working (Auto-managed)' : 'Invalid',
        auto_refresh: 'Enabled - tokens are automatically refreshed when needed'
      });

    } catch (error) {
      return NextResponse.json({
        configured: true,
        token_valid: false,
        error: error instanceof Error ? error.message : 'Failed to test token'
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
