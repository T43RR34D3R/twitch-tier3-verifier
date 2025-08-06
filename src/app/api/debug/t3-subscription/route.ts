/* eslint-disable @typescript-eslint/no-explicit-any */
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

    if (!token.sub || !token.accessToken) {
      return NextResponse.json({ 
        error: 'Missing token data',
        hasUserId: !!token.sub,
        hasAccessToken: !!token.accessToken
      }, { status: 400 })
    }

    const broadcasterId = process.env.TWITCH_CHANNEL_ID!
    
    if (!broadcasterId) {
      return NextResponse.json({ 
        error: 'TWITCH_CHANNEL_ID not configured' 
      }, { status: 500 })
    }

    // Make the same API call as the T3 verification
    const debugInfo = {
      request: {
        url: `https://api.twitch.tv/helix/subscriptions/user?broadcaster_id=${broadcasterId}&user_id=${token.sub}`,
        broadcasterId,
        userId: token.sub,
        userName: token.name,
        hasAccessToken: !!token.accessToken,
        accessTokenLength: token.accessToken.length
      },
      response: null as any,
      parsedData: null as any,
      error: null as any,
      analysis: null as any
    };

    try {
      const response = await fetch(
        `https://api.twitch.tv/helix/subscriptions/user?broadcaster_id=${broadcasterId}&user_id=${token.sub}`,
        {
          headers: {
            'Authorization': `Bearer ${token.accessToken}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID!,
          },
        }
      );

      debugInfo.response = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      };

      if (response.ok) {
        const subscriptionData = await response.json();
        debugInfo.parsedData = subscriptionData;
        
        // Analyze the subscription data
        if (subscriptionData.data && subscriptionData.data.length > 0) {
          const subscription = subscriptionData.data[0];
          debugInfo.analysis = {
            hasSubscription: true,
            tier: subscription.tier,
            isTier3: subscription.tier === "3000",
            isGift: subscription.is_gift || false,
            planName: subscription.plan_name || 'Unknown'
          };
        } else {
          debugInfo.analysis = {
            hasSubscription: false,
            reason: "No subscription data returned"
          };
        }
      } else {
        const errorText = await response.text();
        debugInfo.error = {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        };
      }

    } catch (fetchError) {
      debugInfo.error = {
        type: 'fetch_error',
        message: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
      };
    }

    return NextResponse.json({
      message: 'T3 Subscription Debug Info',
      debug: debugInfo
    })

  } catch (error) {
    console.error('Error in T3 subscription debug:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
