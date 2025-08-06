import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { getPageSettings, savePageSettings } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin (Buckfoozle - multiple IDs)
    if (token.sub !== process.env.ADMIN_USER_ID && token.sub !== process.env.ADMIN_USER_ID_2) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const settings = await getPageSettings()
    return NextResponse.json({ settings })
    
  } catch (error) {
    console.error("Error fetching page settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin (Buckfoozle - multiple IDs)
    if (token.sub !== process.env.ADMIN_USER_ID && token.sub !== process.env.ADMIN_USER_ID_2) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    await savePageSettings(body)

    // Create response with cache invalidation headers
    const response = NextResponse.json({ success: true })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
    
  } catch (error) {
    console.error("Error saving page settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
