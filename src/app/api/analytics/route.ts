import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { supabase } from '@/lib/supabase'
import { authOptions } from '@/lib/auth'
import { ApiClient } from '@twurple/api'
import { StaticAuthProvider } from '@twurple/auth'

// Initialize Twitch API client with user token
const getApiClient = (accessToken: string) => {
  const authProvider = new StaticAuthProvider(
    process.env.TWITCH_CLIENT_ID!,
    accessToken
  )
  return new ApiClient({ authProvider })
}

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

    // Get user's access token from session
    if (!session.accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const apiClient = getApiClient(session.accessToken)

    switch (type) {
      case 'summary':
        try {
          // Get channel info
          // const channel = await apiClient.channels.getChannelInfoById(broadcasterId)
          const user = await apiClient.users.getUserById(broadcasterId)
          
          // Get current stream if live
          const stream = await apiClient.streams.getStreamByUserId(broadcasterId)
          
          // Get follower count (requires special scope, may not work)
          let followerCount = 0
          try {
            const followers = await apiClient.channels.getChannelFollowerCount(broadcasterId)
            followerCount = followers
          } catch (error) {
            console.log('Follower count not available:', error)
          }
          
          // Get subscriber count (requires broadcaster token, may not work with app token)
          const subscriberCount = 0
          try {
            // const subs = await apiClient.subscriptions.getSubscriptions(broadcasterId, { limit: 1 })
            // This will likely fail with app token, we'd need user token
          } catch (error) {
            console.log('Subscriber count not available:', error)
          }
          
          const summary = {
            latest: {
              follower_count: followerCount,
              subscriber_count: subscriberCount,
              tier1_subs: 0, // Would need EventSub for real data
              tier2_subs: 0,
              tier3_subs: 0
            },
            totalStreamsLast30Days: 0, // Would need to track over time
            totalStreamsLast7Days: 0,
            avgViewersLast30Days: stream?.viewers || 0,
            peakViewersLast30Days: stream?.viewers || 0,
            totalBitsLast30Days: 0, // Would need EventSub
            totalStreamTimeLast30Days: 0, // Would need to track over time
            currentStream: stream ? {
              title: stream.title,
              game: stream.gameName,
              viewers: stream.viewers,
              startedAt: stream.startDate,
              isLive: true
            } : null,
            channelInfo: {
              displayName: user?.displayName,
              description: user?.description,
              profilePictureUrl: user?.profilePictureUrl,
              createdAt: user?.creationDate
            }
          }
          
          return NextResponse.json({ summary })
        } catch (error) {
          console.error('Error fetching channel summary:', error)
          return NextResponse.json({ error: 'Failed to fetch channel data' }, { status: 500 })
        }

      case 'stream':
        try {
          // For stream analytics over time, we'd need to store data or use Twitch Analytics API
          // For now, return current stream data
          const stream = await apiClient.streams.getStreamByUserId(broadcasterId)
          const streamData = stream ? [{
            date: new Date().toISOString().split('T')[0],
            average_viewers: stream.viewers,
            peak_viewers: stream.viewers,
            follower_count: 0, // Would need to track over time
            subscriber_count: 0, // Would need to track over time
            total_bits: 0 // Would need EventSub
          }] : []
          
          return NextResponse.json({ data: streamData })
        } catch (error) {
          console.error('Error fetching stream data:', error)
          return NextResponse.json({ data: [] })
        }

      case 'subscriptions':
        // Subscription stats would require EventSub or user access token
        return NextResponse.json({ 
          stats: {
            newSubs: 0,
            reSubs: 0,
            gifts: 0,
            tier1: 0,
            tier2: 0,
            tier3: 0,
            total: 0
          }
        })

      case 'growth':
        // Growth analytics would need historical data tracking
        return NextResponse.json({ 
          growth: {
            followerGrowth: 0,
            subscriberGrowth: 0,
            tier3Growth: 0,
            followerGrowthPercentage: '0.0',
            subscriberGrowthPercentage: '0.0'
          }
        })

      case 'chat':
        // Chat analytics would need EventSub for real-time chat data
        return NextResponse.json({ data: [] })

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
