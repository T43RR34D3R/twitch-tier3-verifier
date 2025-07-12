import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { 
  getAnalyticsSummary, 
  getStreamAnalytics, 
  getSubscriptionStats,
  getGrowthAnalytics,
  getChatAnalytics 
} from '@/lib/analytics'
import { supabase } from '@/lib/supabase'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const broadcasterId = session.user.id

    // Check if user has analytics access
    const { data: accessCheck } = await supabase
      .from('analytics_access')
      .select('enabled')
      .eq('user_id', broadcasterId)
      .single()
    
    if (!accessCheck || !accessCheck.enabled) {
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
        const sortBy = searchParams.get('sort') || 'created_at'
        const sortOrder = searchParams.get('order') || 'desc'
        
        let query = supabase
          .from('subscription_history')
          .select('*')
          .eq('broadcaster_id', broadcasterId)
        
        if (searchQuery) {
          query = query.or(`subscriber_name.ilike.%${searchQuery}%,gifter_name.ilike.%${searchQuery}%`)
        }
        
        if (tierFilter) {
          query = query.eq('tier', parseInt(tierFilter))
        }
        
        query = query.order(sortBy, { ascending: sortOrder === 'asc' })
        
        const { data: subscriberResult, error } = await query
        
        if (error) {
          console.error('Error fetching subscriber list:', error)
          return NextResponse.json({ error: 'Failed to fetch subscriber data' }, { status: 500 })
        }
        
        // Calculate estimated earnings
        const tier1_count = subscriberResult?.filter(s => s.tier === 1000).length || 0
        const tier2_count = subscriberResult?.filter(s => s.tier === 2000).length || 0
        const tier3_count = subscriberResult?.filter(s => s.tier === 3000).length || 0
        
        const estimated_earnings = {
          tier1: tier1_count * 2.5, // Approximate earnings after platform cut
          tier2: tier2_count * 5.0,
          tier3: tier3_count * 12.5,
          total: (tier1_count * 2.5) + (tier2_count * 5.0) + (tier3_count * 12.5)
        }
        
        return NextResponse.json({ 
          data: {
            subscribers: subscriberResult?.map(sub => ({
              id: sub.id,
              user_id: sub.subscriber_id,
              username: sub.subscriber_name,
              display_name: sub.subscriber_name,
              tier: sub.tier.toString(),
              subscribed_at: sub.created_at,
              is_gift: sub.is_gift,
              gifter_id: sub.gifter_id,
              gifter_username: sub.gifter_name,
              gifter_display_name: sub.gifter_name,
              months_total: sub.cumulative_months,
              months_streak: sub.streak_months,
              cumulative_months: sub.cumulative_months
            })) || [],
            total: subscriberResult?.length || 0,
            tier1_count,
            tier2_count,
            tier3_count,
            estimated_earnings
          }
        })

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in analytics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
