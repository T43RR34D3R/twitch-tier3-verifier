import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { addVerificationLog } from "@/lib/database"

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

    // Override for testing - TearReader always passes
    if (token.name === "TearReader") {
      console.log("TearReader override: granting Tier 3 access");
      
      // Log the verification attempt
      try {
        const logResult = await addVerificationLog({
          user_name: token.name || "Unknown",
          user_id: token.sub,
          success: true,
          message: "Tier 3 subscription verified! (Override for TearReader)"
        });
        console.log('TearReader verification logged:', !!logResult);
      } catch (logError) {
        console.error('Failed to log TearReader verification:', logError);
      }
      
      return NextResponse.json({ 
        isTier3: true, 
        message: "Tier 3 subscription verified! (Override for TearReader)" 
      });
    }

    // Override for Buck - always passes
    if (token.name === "BuckFoozle" || token.name === "buckfoozle") {
      console.log("Buck override: granting Tier 3 access");
      
      // Log the verification attempt
      try {
        const logResult = await addVerificationLog({
          user_name: token.name || "Unknown",
          user_id: token.sub,
          success: true,
          message: "Tier 3 subscription verified! (Override for Buck)"
        });
        console.log('Buck verification logged:', !!logResult);
      } catch (logError) {
        console.error('Failed to log Buck verification:', logError);
      }
      
      return NextResponse.json({ 
        isTier3: true, 
        message: "Tier 3 subscription verified! (Override for Buck)" 
      });
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
        // Log the failed verification attempt
        try {
          await addVerificationLog({
            user_name: token.name || "Unknown",
            user_id: token.sub,
            success: false,
            message: "Not subscribed to the channel"
          });
        } catch (logError) {
          console.error('Failed to log 404 verification:', logError);
        }
        
        return NextResponse.json({ 
          isTier3: false, 
          message: "Not subscribed to the channel" 
        })
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Subscription API error:", errorText);
        
        // If token is invalid, return a special error to force re-authentication
        if (response.status === 401) {
          return NextResponse.json({ 
            error: "Invalid token", 
            forceReauth: true,
            message: "Your session has expired. Please sign in again."
          }, { status: 401 });
        }
        
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const subscriptionData = await response.json();
      console.log("Subscription API response:", subscriptionData);
      
      if (subscriptionData.data && subscriptionData.data.length > 0) {
        const subscription = subscriptionData.data[0];
        // Check if it's Tier 3 (tier "3000" in Twitch API)
        const isTier3 = subscription.tier === "3000"
        
        // Log the verification attempt
        try {
          await addVerificationLog({
            user_name: token.name || "Unknown",
            user_id: token.sub,
            success: isTier3,
            message: isTier3 ? "Tier 3 subscription confirmed!" : `Current tier: ${subscription.tier} (not Tier 3)`
          });
        } catch (logError) {
          console.error('Failed to log subscription verification:', logError);
        }
        
        return NextResponse.json({ 
          isTier3, 
          tier: subscription.tier,
          message: isTier3 ? "Tier 3 subscription confirmed!" : `Current tier: ${subscription.tier}`
        })
      } else {
        // Log the failed verification attempt
        try {
          await addVerificationLog({
            user_name: token.name || "Unknown",
            user_id: token.sub,
            success: false,
            message: "Not subscribed to the channel"
          });
        } catch (logError) {
          console.error('Failed to log no subscription verification:', logError);
        }
        
        return NextResponse.json({ 
          isTier3: false, 
          message: "Not subscribed to the channel" 
        })
      }
      
    } catch (subscriptionError) {
      // User is not subscribed or we don't have permission to check
      console.log("Subscription check failed:", subscriptionError);
      
      // Log the failed verification attempt
      try {
        await addVerificationLog({
          user_name: token.name || "Unknown",
          user_id: token.sub,
          success: false,
          message: "Not subscribed or unable to verify subscription"
        });
      } catch (logError) {
        console.error('Failed to log subscription error verification:', logError);
      }
      
      return NextResponse.json({ 
        isTier3: false, 
        message: "Not subscribed or unable to verify subscription" 
      })
    }
    
  } catch (error) {
    console.error("Error checking tier 3 status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
