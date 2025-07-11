import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { 
  getAnalyticsSummary, 
  getStreamAnalytics, 
  getSubscriptionStats,
  getGrowthAnalytics,
  getChatAnalytics 
} from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const days = parseInt(searchParams.get('days') || '30')
    
    // For now, we'll use the user's ID as broadcaster_id
    // In a real app, you'd have a way to determine if this user is a broadcaster
    const broadcasterId = session.user.id || 'test_broadcaster'

    switch (type) {
      case 'summary':
        const summary = await getAnalyticsSummary(broadcasterId)
        return NextResponse.json({ summary })

      case 'stream':
        const streamData = await getStreamAnalytics(broadcasterId, days)
        return NextResponse.json({ data: streamData })

      case 'subscriptions':
        const subStats = await getSubscriptionStats(broadcasterId)
        return NextResponse.json({ stats: subStats })

      case 'growth':
        const growth = await getGrowthAnalytics(broadcasterId)
        return NextResponse.json({ growth })

      case 'chat':
        const chatData = await getChatAnalytics(broadcasterId, days)
        return NextResponse.json({ data: chatData })

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in analytics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
