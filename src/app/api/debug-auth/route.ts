import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token) {
      return NextResponse.json({ 
        error: "Not authenticated",
        authenticated: false,
        message: "Please sign in first"
      });
    }
    
    const userId = token.sub;
    const userName = token.name;
    const adminUserId1 = process.env.ADMIN_USER_ID;
    const adminUserId2 = process.env.ADMIN_USER_ID_2;
    
    const isAdmin1 = userId === adminUserId1;
    const isAdmin2 = userId === adminUserId2;
    const isAdmin = isAdmin1 || isAdmin2;
    
    return NextResponse.json({
      authenticated: true,
      currentUserId: userId,
      currentUserName: userName,
      envAdminUserId1: adminUserId1,
      envAdminUserId2: adminUserId2,
      isAdmin1Match: isAdmin1,
      isAdmin2Match: isAdmin2,
      isAdminOverall: isAdmin,
      tokenData: {
        sub: token.sub,
        name: token.name,
        email: token.email,
        picture: token.picture
      }
    });
    
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
