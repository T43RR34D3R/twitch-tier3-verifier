import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { logUserActivity } from "../../../../lib/userActivityLog"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    console.log("Token debug:", {
      hasToken: !!token,
      hasAccessToken: !!token?.accessToken,
      sub: token?.sub,
      tokenKeys: token ? Object.keys(token) : [],
      name: token?.name
    })
    
    if (!token || !token.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    // Admin bypass - admins are automatically tier 3
    const allowedAdmins = ["TearReader", "BuckFoozle", "tearreader", "buckfoozle"];
    if (allowedAdmins.includes(token?.name || "")) {
      logUserActivity(token.name || "Unknown", "tier3_check", "success", "Admin bypass - granted tier 3 access");
      return NextResponse.json({ 
        isTier3: true, 
        tier: "admin",
        message: "Admin access granted - Tier 3 verified!"
      })
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

    console.log("Checking subscription status:", {
      userId: token.sub,
      broadcasterId: broadcasterId
    })

    // Check subscription status using direct API call
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

      console.log("Subscription API response status:", response.status);
      
      if (response.status === 404) {
        logUserActivity(token.name || "Unknown", "tier3_check", "failed", "Not subscribed to the channel");
        return NextResponse.json({ 
          isTier3: false, 
          message: "Not subscribed to the channel" 
        })
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Subscription API error:", errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const subscriptionData = await response.json();
      console.log("Subscription API response:", subscriptionData);
      
      if (subscriptionData.data && subscriptionData.data.length > 0) {
        const subscription = subscriptionData.data[0];
        // Check if it's Tier 3 (tier "3000" in Twitch API)
        const isTier3 = subscription.tier === "3000"
        
        if (isTier3) {
          logUserActivity(token.name || "Unknown", "tier3_check", "success", `Tier 3 subscription confirmed - tier: ${subscription.tier}`);
        } else {
          logUserActivity(token.name || "Unknown", "tier3_check", "failed", `User has subscription but not tier 3 - current tier: ${subscription.tier}`);
        }
        
        return NextResponse.json({ 
          isTier3, 
          tier: subscription.tier,
          message: isTier3 ? "Tier 3 subscription confirmed!" : `Current tier: ${subscription.tier}`
        })
      } else {
        logUserActivity(token.name || "Unknown", "tier3_check", "failed", "Not subscribed to the channel");
        return NextResponse.json({ 
          isTier3: false, 
          message: "Not subscribed to the channel" 
        })
      }
      
    } catch (subscriptionError) {
      // User is not subscribed or we don't have permission to check
      console.log("Subscription check failed:", subscriptionError);
      logUserActivity(token.name || "Unknown", "tier3_check", "failed", `Subscription check failed: ${subscriptionError}`);
      return NextResponse.json({ 
        isTier3: false, 
        message: "Not subscribed or unable to verify subscription" 
      })
    }
    
  } catch (error) {
    console.error("Error checking tier 3 status:", error)
    logUserActivity("Unknown", "tier3_check", "failed", `Internal server error: ${error}`);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
