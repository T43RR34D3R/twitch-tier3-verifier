import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token) {
      return NextResponse.json({ isAdmin: false, message: "Not authenticated" }, { status: 401 })
    }
    
    const userName = token.name;
    const userId = token.sub;
    
    if (!userId) {
      return NextResponse.json({ isAdmin: false, message: "Invalid user data" }, { status: 400 })
    }
    
    // Check if user is admin (Buckfoozle - multiple IDs)
    const isAdmin = userId === process.env.ADMIN_USER_ID || userId === process.env.ADMIN_USER_ID_2;
    
    console.log("Admin check:", { 
      userName, 
      userId, 
      envAdminUserId: process.env.ADMIN_USER_ID,
      isAdmin,
      comparison: `${userId} === ${process.env.ADMIN_USER_ID}` 
    });
    
    return NextResponse.json({ 
      isAdmin, 
      userName,
      userId,
      role: isAdmin ? "admin" : null,
      message: isAdmin ? "Admin access granted" : "Access denied - Contact administrator for access"
    })
    
  } catch (error) {
    console.error("Error checking admin status:", error)
    return NextResponse.json({ isAdmin: false, error: "Internal server error" }, { status: 500 })
  }
}
