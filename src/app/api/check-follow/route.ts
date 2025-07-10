import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    console.log("Token debug:", {
      hasToken: !!token,
      hasAccessToken: !!token?.accessToken,
      sub: token?.sub,
      tokenKeys: token ? Object.keys(token) : []
    })
    
    if (!token || !token.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    if (!token.sub) {
      console.error("No user ID (sub) found in token");
      return NextResponse.json({ error: "User ID not found in token" }, { status: 400 })
    }

    // Use broadcaster ID directly from environment
    const broadcasterId = process.env.TWITCH_CHANNEL_ID!
    
    if (!broadcasterId) {
      return NextResponse.json({ error: "Channel ID not configured" }, { status: 500 })
    }

    console.log("Checking follow status:", {
      userId: token.sub,
      broadcasterId: broadcasterId
    })

    // Check if user is following the channel using direct API call
    try {
      const response = await fetch(
        `https://api.twitch.tv/helix/channels/followed?user_id=${token.sub}&broadcaster_id=${broadcasterId}`,
        {
          headers: {
            'Authorization': `Bearer ${token.accessToken}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID!,
          },
        }
      );

      console.log("Follow API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Follow API error:", errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const followData = await response.json();
      console.log("Follow API response:", followData);
      
      if (followData.data && followData.data.length > 0) {
        const follow = followData.data[0];
        return NextResponse.json({ 
          isFollowing: true, 
          followedAt: follow.followed_at,
          message: `You are following ${process.env.TWITCH_CHANNEL_NAME || 'the channel'} since ${new Date(follow.followed_at).toDateString()}!`
        })
      } else {
        return NextResponse.json({ 
          isFollowing: false, 
          message: `You are not following ${process.env.TWITCH_CHANNEL_NAME || 'the channel'}`
        })
      }
      
    } catch (followError) {
      console.log("Follow check failed:", followError);
      return NextResponse.json({ 
        isFollowing: false, 
        message: "Unable to verify follow status"
      })
    }
    
  } catch (error) {
    console.error("Error checking follow status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
