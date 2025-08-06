import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const searchParams = request.nextUrl.searchParams
    
    // Log all the parameters we're receiving
    const debugInfo = {
      isAuthenticated: !!session,
      userId: session?.user?.id,
      userName: session?.user?.name,
      searchParams: Object.fromEntries(searchParams.entries()),
      url: request.url,
      nextUrl: request.nextUrl.toString(),
      callbackUrl: searchParams.get('callbackUrl'),
      headers: {
        referer: request.headers.get('referer'),
        'user-agent': request.headers.get('user-agent'),
      }
    }
    
    console.log('Auth callback debug info:', debugInfo)
    
    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error('Debug auth callback error:', error)
    return NextResponse.json({ error: 'Failed to debug auth callback' }, { status: 500 })
  }
}
