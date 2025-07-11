import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { 
  getAnalyticsSummary, 
  getStreamAnalytics, 
  getSubscriptionStats,
  getGrowthAnalytics,
  getChatAnalytics 
} from '@/lib/analytics'
import { sql } from '@vercel/postgres'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const broadcasterId = session.user.id

    // Check if user has analytics access
    const accessCheck = await sql`
      SELECT enabled FROM analytics_access 
      WHERE twitch_user_id = ${broadcasterId}
    `
    
    if (accessCheck.rows.length === 0 || !accessCheck.rows[0].enabled) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const days = parseInt(searchParams.get('days') || '30')

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

      case 'subscriber_list':
        const searchQuery = searchParams.get('search') || ''
        const tierFilter = searchParams.get('tier')
        const sortBy = searchParams.get('sort') || 'date_subscribed'
        const sortOrder = searchParams.get('order') || 'desc'
        
        let query = `
          SELECT 
            username,
            tier,
            is_gift,
            gift_from,
            date_subscribed,
            months_subscribed
          FROM subscription_history 
          WHERE broadcaster_id = $1
        `
        
        const queryParams = [broadcasterId]
        
        if (searchQuery) {
          query += ` AND LOWER(username) LIKE $${queryParams.length + 1}`
          queryParams.push(`%${searchQuery.toLowerCase()}%`)
        }
        
        if (tierFilter) {
          query += ` AND tier = $${queryParams.length + 1}`
          queryParams.push(tierFilter)
        }
        
        query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`
        
        const subscriberResult = await sql.query(query, queryParams)
        
        return NextResponse.json({ 
          subscribers: subscriberResult.rows,
          total: subscriberResult.rows.length 
        })

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in analytics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
