import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { getPageSettings, savePageSettings } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin (only TearReader for now)
    if (token.name !== "TearReader") {
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

    // Check if user is admin (only TearReader for now)
    if (token.name !== "TearReader") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    await savePageSettings(body)

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error("Error saving page settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
