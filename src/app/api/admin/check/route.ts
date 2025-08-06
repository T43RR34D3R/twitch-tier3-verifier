import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { query } from "@/lib/railway-db"

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
    
    // Check if user is admin in database
    const adminCheckSql = `
      SELECT user_id, username, display_name, role, is_active
      FROM admin_users 
      WHERE (user_id = $1 OR username ILIKE $2) 
      AND is_active = true
    `;
    
    const result = await query(adminCheckSql, [userId, userName || '']);
    const isAdmin = result.rows.length > 0;
    
    // Update last login time if admin
    if (isAdmin) {
      const updateLoginSql = `
        UPDATE admin_users 
        SET last_login_at = NOW() 
        WHERE user_id = $1
      `;
      await query(updateLoginSql, [userId]).catch(err => 
        console.error('Failed to update last login:', err)
      );
    }
    
    console.log("Admin check:", { userName, userId, isAdmin, adminData: result.rows[0] });
    
    return NextResponse.json({ 
      isAdmin, 
      userName,
      userId,
      role: result.rows[0]?.role || null,
      message: isAdmin ? "Admin access granted" : "Access denied - Contact administrator for access"
    })
    
  } catch (error) {
    console.error("Error checking admin status:", error)
    return NextResponse.json({ isAdmin: false, error: "Internal server error" }, { status: 500 })
  }
}
