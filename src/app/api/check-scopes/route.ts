import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token || !token.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Validate the token and get scopes by calling Twitch's validation endpoint
    try {
      const response = await fetch("https://id.twitch.tv/oauth2/validate", {
        headers: {
          'Authorization': `OAuth ${token.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({ 
          error: "Token validation failed", 
          details: errorText 
        }, { status: response.status });
      }

      const validationData = await response.json();
      
      return NextResponse.json({
        scopes: validationData.scopes || [],
        clientId: validationData.client_id,
        userId: validationData.user_id,
        expiresIn: validationData.expires_in,
        hasFollowsScope: (validationData.scopes || []).includes('user:read:follows'),
        hasSubscriptionsScope: (validationData.scopes || []).includes('user:read:subscriptions'),
        message: `Current scopes: ${(validationData.scopes || []).join(', ')}`
      });
      
    } catch (error) {
      console.error("Error validating token:", error);
      return NextResponse.json({ 
        error: "Failed to validate token",
        details: error 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("Error checking scopes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
