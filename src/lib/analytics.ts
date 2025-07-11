import { supabase, StreamAnalytics, SubscriptionHistory, StreamSession, ChatAnalytics } from './supabase'
import { subDays, format } from 'date-fns'

// Stream Analytics
export async function getStreamAnalytics(
  broadcasterId: string, 
  days: number = 30
): Promise<StreamAnalytics[]> {
  try {
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd')
    
    const { data, error } = await supabase
      .from('stream_analytics')
      .select('*')
      .eq('broadcaster_id', broadcasterId)
      .gte('date', startDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching stream analytics:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching stream analytics:', error)
    return []
  }
}

export async function getAnalyticsSummary(broadcasterId: string) {
  try {
    const last30Days = await getStreamAnalytics(broadcasterId, 30)
    const last7Days = await getStreamAnalytics(broadcasterId, 7)
    
    if (last30Days.length === 0) {
      return null
    }

    const latest = last30Days[last30Days.length - 1]
    const totalStreamsLast30Days = last30Days.filter(d => d.total_stream_time_minutes > 0).length
    const totalStreamsLast7Days = last7Days.filter(d => d.total_stream_time_minutes > 0).length
    const avgViewersLast30Days = Math.round(
      last30Days.reduce((sum, d) => sum + d.average_viewers, 0) / last30Days.length
    )
    const peakViewersLast30Days = Math.max(...last30Days.map(d => d.peak_viewers))
    const totalBitsLast30Days = last30Days.reduce((sum, d) => sum + d.total_bits, 0)
    const totalStreamTimeLast30Days = last30Days.reduce((sum, d) => sum + d.total_stream_time_minutes, 0)

    return {
      latest,
      totalStreamsLast30Days,
      totalStreamsLast7Days,
      avgViewersLast30Days,
      peakViewersLast30Days,
      totalBitsLast30Days,
      totalStreamTimeLast30Days: Math.round(totalStreamTimeLast30Days / 60), // Convert to hours
    }
  } catch (error) {
    console.error('Error calculating analytics summary:', error)
    return null
  }
}

// Subscription Analytics
export async function getSubscriptionHistory(
  broadcasterId: string,
  days: number = 30
): Promise<SubscriptionHistory[]> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('broadcaster_id', broadcasterId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching subscription history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching subscription history:', error)
    return []
  }
}

export async function getSubscriptionStats(broadcasterId: string) {
  try {
    const history = await getSubscriptionHistory(broadcasterId, 30)
    
    const newSubs = history.filter(h => h.event_type === 'subscribe').length
    const reSubs = history.filter(h => h.event_type === 'resubscribe').length
    const gifts = history.filter(h => h.event_type === 'subscribe' && h.is_gift).length
    const tier1 = history.filter(h => h.tier === 1000).length
    const tier2 = history.filter(h => h.tier === 2000).length
    const tier3 = history.filter(h => h.tier === 3000).length

    return {
      newSubs,
      reSubs,
      gifts,
      tier1,
      tier2,
      tier3,
      total: newSubs + reSubs
    }
  } catch (error) {
    console.error('Error calculating subscription stats:', error)
    return null
  }
}

// Stream Sessions
export async function getStreamSessions(
  broadcasterId: string,
  days: number = 30
): Promise<StreamSession[]> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('stream_sessions')
      .select('*')
      .eq('broadcaster_id', broadcasterId)
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Error fetching stream sessions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching stream sessions:', error)
    return []
  }
}

// Chat Analytics
export async function getChatAnalytics(
  broadcasterId: string,
  days: number = 30
): Promise<ChatAnalytics[]> {
  try {
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd')
    
    const { data, error } = await supabase
      .from('chat_analytics')
      .select('*')
      .eq('broadcaster_id', broadcasterId)
      .gte('date', startDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching chat analytics:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching chat analytics:', error)
    return []
  }
}

// Growth Analytics
export async function getGrowthAnalytics(broadcasterId: string) {
  try {
    const analytics = await getStreamAnalytics(broadcasterId, 30)
    
    if (analytics.length === 0) return null

    const oldest = analytics[0]
    const newest = analytics[analytics.length - 1]
    
    const followerGrowth = newest.follower_count - oldest.follower_count
    const subscriberGrowth = newest.subscriber_count - oldest.subscriber_count
    const tier3Growth = newest.tier3_subs - oldest.tier3_subs

    return {
      followerGrowth,
      subscriberGrowth,
      tier3Growth,
      followerGrowthPercentage: oldest.follower_count > 0 ? 
        ((followerGrowth / oldest.follower_count) * 100).toFixed(1) : '0.0',
      subscriberGrowthPercentage: oldest.subscriber_count > 0 ? 
        ((subscriberGrowth / oldest.subscriber_count) * 100).toFixed(1) : '0.0',
    }
  } catch (error) {
    console.error('Error calculating growth analytics:', error)
    return null
  }
}

// Mock data generator for testing (remove in production)
export async function generateMockData(broadcasterId: string, broadcasterName: string) {
  try {
    const analytics = await getStreamAnalytics(broadcasterId, 1)
    if (analytics.length > 0) {
      console.log('Mock data already exists for this broadcaster')
      return
    }

    // Use the sample data from the SQL file
    console.log('Mock data would be generated here - use the SQL file instead')
    
  } catch (error) {
    console.error('Error generating mock data:', error)
  }
}
