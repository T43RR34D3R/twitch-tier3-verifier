import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token || !token.accessToken) {
      return NextResponse.json({ error: "Not authenticated or no access token" }, { status: 401 })
    }

    // Test fetching user info from Twitch API
    const response = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID!,
      },
    })

    const userData = await response.json()

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      tokenPresent: !!token.accessToken,
      userData: userData,
      tokenInfo: {
        hasAccessToken: !!token.accessToken,
        hasRefreshToken: !!token.refreshToken,
        error: token.error,
      }
    })
    
  } catch (error) {
    console.error("Error fetching user info:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
