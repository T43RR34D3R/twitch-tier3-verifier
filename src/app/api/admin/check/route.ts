import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const ADMIN_USERS = ["TearReader", "BuckFoozle"];

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token) {
      return NextResponse.json({ isAdmin: false, message: "Not authenticated" }, { status: 401 })
    }
    
    const userName = token.name;
    const isAdmin = ADMIN_USERS.includes(userName || "");
    
    return NextResponse.json({ 
      isAdmin, 
      userName,
      message: isAdmin ? "Admin access granted" : "Access denied"
    })
    
  } catch (error) {
    console.error("Error checking admin status:", error)
    return NextResponse.json({ isAdmin: false, error: "Internal server error" }, { status: 500 })
  }
}
