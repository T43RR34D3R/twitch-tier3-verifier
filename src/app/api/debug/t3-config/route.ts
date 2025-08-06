import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Admin users who can access this debug endpoint
const ADMIN_USERS = ["TearReader", "BuckFoozle"];

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const userName = token.name;
    const isAdmin = ADMIN_USERS.includes(userName || "");
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check environment variables (without exposing sensitive values)
    const envCheck = {
      hasChannelId: !!process.env.TWITCH_CHANNEL_ID,
      channelIdValue: process.env.TWITCH_CHANNEL_ID ? 'SET' : 'NOT_SET',
      hasClientId: !!process.env.TWITCH_CLIENT_ID,
      hasClientSecret: !!process.env.TWITCH_CLIENT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      // Show actual channel ID for debugging (only for admins)
      actualChannelId: process.env.TWITCH_CHANNEL_ID,
    };

    // Token info for current user
    const tokenInfo = {
      userName: token.name,
      userId: token.sub,
      hasAccessToken: !!token.accessToken,
      accessTokenLength: token.accessToken ? token.accessToken.length : 0,
      tokenKeys: Object.keys(token)
    };

    return NextResponse.json({
      environment: envCheck,
      userToken: tokenInfo,
      message: 'T3 Configuration Debug Info'
    })
  } catch (error) {
    console.error('Error in T3 config debug:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
