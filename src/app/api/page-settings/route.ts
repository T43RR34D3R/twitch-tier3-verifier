import { NextResponse } from "next/server"
import { getPageSettings } from "@/lib/database"

export async function GET() {
  try {
    const settings = await getPageSettings()
    
    // Add cache headers to prevent caching issues
    const response = NextResponse.json({ settings })
    
    // Set cache headers to prevent browser caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    return response
    
  } catch (error) {
    console.error("Error fetching page settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
