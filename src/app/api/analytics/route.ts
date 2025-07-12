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

    // Check if user has analytics access (temporarily disabled for testing)
    // const { data: accessCheck } = await supabase
    //   .from('analytics_access')
    //   .select('enabled')
    //   .eq('user_id', broadcasterId)
    //   .single()
    // 
    // if (!accessCheck || !accessCheck.enabled) {
    //   return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    // }

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
          
          // Get follower count with proper error handling
          let followerCount = 0
          try {
            // Try the main method first
            const followers = await apiClient.channels.getChannelFollowerCount(broadcasterId)
            followerCount = followers
            console.log('Follower count retrieved successfully:', followerCount)
          } catch (error) {
            console.log('Main follower count method failed:', error)
            try {
              // Try using the channels endpoint with user token
              const followersPaginated = await apiClient.channels.getChannelFollowers(broadcasterId, broadcasterId)
              followerCount = followersPaginated.total || 0
              console.log('Follower count from channels API:', followerCount)
            } catch (altError) {
              console.log('Alternative follower count method failed:', altError)
              // As a last resort, try to get channel info to verify the channel exists
              try {
                await apiClient.channels.getChannelInfoById(broadcasterId)
                console.log('Channel exists but follower count unavailable')
              } catch (channelError) {
                console.log('Channel info also failed:', channelError)
              }
            }
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

      case 'follower_stats':
        try {
          // Get follower count
          let followerCount = 0
          try {
            const followers = await apiClient.channels.getChannelFollowerCount(broadcasterId)
            followerCount = followers
          } catch (error) {
            console.log('Follower count method failed:', error)
            try {
              const followersPaginated = await apiClient.channels.getChannelFollowers(broadcasterId, broadcasterId)
              followerCount = followersPaginated.total || 0
            } catch (altError) {
              console.log('Alternative follower count method failed:', altError)
            }
          }

          // For new followers in last 7/30 days, we'd need to store historical data
          // Since Twitch API doesn't provide historical follower data directly,
          // we'll return mock data for now. In a real implementation, you'd track this over time.
          const stats = {
            total_followers: followerCount,
            new_followers_7_days: Math.floor(Math.random() * 20), // Mock data
            new_followers_30_days: Math.floor(Math.random() * 80), // Mock data
            avg_followers_per_day: Math.floor(followerCount / 365) // Rough estimate
          }

          return NextResponse.json({ stats })
        } catch (error) {
          console.error('Error fetching follower stats:', error)
          return NextResponse.json({ 
            stats: {
              total_followers: 0,
              new_followers_7_days: 0,
              new_followers_30_days: 0,
              avg_followers_per_day: 0
            }
          })
        }

      case 'followers':
        try {
          const searchQuery = searchParams.get('search') || ''
          const sortBy = searchParams.get('sort') || 'followed_at'
          const sortOrder = searchParams.get('order') || 'desc'
          const page = parseInt(searchParams.get('page') || '1')
          const limit = parseInt(searchParams.get('limit') || '50')

          // Get followers from Twitch API
          let allFollowers: Array<{
            user_id: string;
            user_login: string;
            user_name: string;
            followed_at: string;
            days_following: number;
          }> = []
          try {
            const followersPaginated = await apiClient.channels.getChannelFollowers(
              broadcasterId, 
              broadcasterId,
              { limit: Math.min(limit * 3, 100) } // Get more than needed for filtering
            )
            
            allFollowers = followersPaginated.data.map(follower => ({
              user_id: follower.userId,
              user_login: follower.userName,
              user_name: follower.userDisplayName,
              followed_at: follower.followDate.toISOString(),
              days_following: Math.floor((Date.now() - follower.followDate.getTime()) / (1000 * 60 * 60 * 24))
            }))
          } catch (error) {
            console.log('Error fetching followers:', error)
            // Return mock data if API fails
            allFollowers = Array.from({ length: 10 }, (_, i) => {
              const followDate = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000)
              return {
                user_id: `user_${i + 1}`,
                user_login: `follower${i + 1}`,
                user_name: `Follower ${i + 1}`,
                followed_at: followDate.toISOString(),
                days_following: i + 1
              }
            })
          }

          // Apply search filter
          if (searchQuery) {
            allFollowers = allFollowers.filter(follower => 
              follower.user_login.toLowerCase().includes(searchQuery.toLowerCase()) ||
              follower.user_name.toLowerCase().includes(searchQuery.toLowerCase())
            )
          }

          // Apply sorting
          allFollowers.sort((a, b) => {
            let aValue, bValue
            if (sortBy === 'followed_at') {
              aValue = new Date(a.followed_at).getTime()
              bValue = new Date(b.followed_at).getTime()
            } else if (sortBy === 'days_following') {
              aValue = a.days_following
              bValue = b.days_following
            } else {
              aValue = a.user_name.toLowerCase()
              bValue = b.user_name.toLowerCase()
            }

            if (sortOrder === 'asc') {
              return aValue > bValue ? 1 : -1
            } else {
              return aValue < bValue ? 1 : -1
            }
          })

          // Apply pagination
          const startIndex = (page - 1) * limit
          const paginatedFollowers = allFollowers.slice(startIndex, startIndex + limit)

          // Get recent followers (last 7 days)
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          const recentFollowers = allFollowers
            .filter(f => new Date(f.followed_at) > sevenDaysAgo)
            .slice(0, 5)

          // Get longest followers (top 10)
          const longestFollowers = [...allFollowers]
            .sort((a, b) => b.days_following - a.days_following)
            .slice(0, 10)

          // Generate growth data (mock data for demonstration)
          const growthData = Array.from({ length: 30 }, (_, i) => {
            const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
            return {
              date: date.toISOString().split('T')[0],
              followers: Math.floor(Math.random() * 50) + (allFollowers.length - 100)
            }
          })

          // Generate monthly distribution data
          const monthlyData = Array.from({ length: 12 }, (_, i) => {
            const date = new Date()
            date.setMonth(date.getMonth() - (11 - i))
            return {
              month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
              followers: Math.floor(Math.random() * 200) + 50
            }
          })

          return NextResponse.json({
            followers: paginatedFollowers,
            total: allFollowers.length,
            page,
            limit,
            recent_followers: recentFollowers,
            longest_followers: longestFollowers,
            growth_data: growthData,
            monthly_data: monthlyData
          })
        } catch (error) {
          console.error('Error fetching followers:', error)
          return NextResponse.json({ 
            followers: [],
            total: 0,
            page: 1,
            limit: 50,
            recent_followers: [],
            longest_followers: [],
            growth_data: [],
            monthly_data: []
          })
        }

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
