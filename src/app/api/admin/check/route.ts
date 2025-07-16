import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const ADMIN_USERS = ["TearReader", "BuckFoozle"];
const ADMIN_USER_IDS = ["1239758967", "269187200"]; // TearReader, BuckFoozle

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token) {
      return NextResponse.json({ isAdmin: false, message: "Not authenticated" }, { status: 401 })
    }
    
    const userName = token.name;
    const userId = token.sub;
    
    // Check both username (case-insensitive) and user ID
    const isAdminByName = ADMIN_USERS.some(adminUser => 
      adminUser.toLowerCase() === (userName || "").toLowerCase()
    );
    const isAdminById = ADMIN_USER_IDS.includes(userId || "");
    const isAdmin = isAdminByName || isAdminById;
    
    console.log("Admin check:", { userName, userId, isAdminByName, isAdminById, isAdmin });
    
    return NextResponse.json({ 
      isAdmin, 
      userName,
      userId,
      message: isAdmin ? "Admin access granted" : "Access denied"
    })
    
  } catch (error) {
    console.error("Error checking admin status:", error)
    return NextResponse.json({ isAdmin: false, error: "Internal server error" }, { status: 500 })
  }
}
