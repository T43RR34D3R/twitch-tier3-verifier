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

    console.log("Performing fake follow check for user:", token.sub);

    // Simulate a brief delay for the "check"
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Always return success - this is now a fake check
    return NextResponse.json({ 
      isFollowing: true, 
      message: `Welcome ${token.name || 'to the verification process'}! Moving to subscription check...`
    })
    
  } catch (error) {
    console.error("Error in fake follow check:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
