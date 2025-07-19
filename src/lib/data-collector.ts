import { supabase } from './supabase'
import { ApiClient } from '@twurple/api'
import { StaticAuthProvider } from '@twurple/auth'

// Store user tokens for data collection
// interface StoredUserToken {
//   user_id: string
//   username: string
//   access_token: string
//   refresh_token: string
//   expires_at: number
//   created_at: string
//   updated_at: string
// }

// Initialize API client with access token
const getApiClient = (accessToken: string) => {
  const authProvider = new StaticAuthProvider(
    process.env.TWITCH_CLIENT_ID!,
    accessToken
  )
  return new ApiClient({ authProvider })
}

// Refresh an expired access token
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number; refresh_token?: string } | null> {
  try {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      console.error('Token refresh failed:', response.statusText)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error refreshing token:', error)
    return null
  }
}

// Get valid access token for a user (refresh if needed)
async function getValidAccessToken(userId: string): Promise<string | null> {
  try {
    // Get stored token
    const { data: tokenData, error } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !tokenData) {
      console.log(`No token found for user ${userId}`)
      return null
    }

    // Check if token is still valid (expires in 1 hour buffer)
    const now = Date.now()
    const expiresAt = tokenData.expires_at

    if (now < expiresAt - 60 * 60 * 1000) {
      // Token is still valid
      return tokenData.access_token
    }

    // Token expired, try to refresh
    console.log(`Refreshing expired token for user ${userId}`)
    const refreshed = await refreshAccessToken(tokenData.refresh_token)

    if (!refreshed) {
      console.error(`Failed to refresh token for user ${userId}`)
      return null
    }

    // Update stored token
    const newExpiresAt = now + (refreshed.expires_in * 1000)
    await supabase
      .from('user_tokens')
      .update({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token || tokenData.refresh_token,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    return refreshed.access_token

  } catch (error) {
    console.error(`Error getting valid access token for user ${userId}:`, error)
    return null
  }
}

// Collect daily analytics for a specific user
async function collectDailyAnalytics(userId: string): Promise<boolean> {
  try {
    console.log(`Starting daily analytics collection for user ${userId}`)

    // Get valid access token
    const accessToken = await getValidAccessToken(userId)
    if (!accessToken) {
      console.error(`No valid access token for user ${userId}`)
      return false
    }

    const apiClient = getApiClient(accessToken)
    const today = new Date().toISOString().split('T')[0]

    // Get user info
    const user = await apiClient.users.getUserById(userId)
    if (!user) {
      console.error(`User not found: ${userId}`)
      return false
    }

    console.log(`Collecting analytics for ${user.displayName}`)

    // Get current stream (if live)
    const stream = await apiClient.streams.getStreamByUserId(userId)

    // Collect follower data
    let followerCount = 0
    try {
      followerCount = await apiClient.channels.getChannelFollowerCount(userId)
    } catch {
      console.log('Follower count failed, trying alternative method')
      try {
        const followers = await apiClient.channels.getChannelFollowers(userId, userId)
        followerCount = followers.total || 0
      } catch {
        console.log('Alternative follower method also failed')
      }
    }

    // Collect subscriber data
    let subscriberCount = 0
    let tier1_subs = 0
    let tier2_subs = 0
    let tier3_subs = 0

    try {
      const subscriptions = await apiClient.subscriptions.getSubscriptions(userId)
      subscriberCount = subscriptions.total || 0

      subscriptions.data.forEach(sub => {
        switch (sub.tier) {
          case '1000':
            tier1_subs++
            break
          case '2000':
            tier2_subs++
            break
          case '3000':
            tier3_subs++
            break
        }
      })
    } catch (error) {
      console.log('Subscriber data not available:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Store in stream_analytics table
    const analyticsData = {
      broadcaster_id: userId,
      broadcaster_name: user.displayName,
      date: today,
      total_stream_time_minutes: 0, // Would need to track throughout the day
      peak_viewers: stream?.viewers || 0,
      average_viewers: stream?.viewers || 0,
      follower_count: followerCount,
      subscriber_count: subscriberCount,
      tier1_subs: tier1_subs,
      tier2_subs: tier2_subs,
      tier3_subs: tier3_subs,
      total_bits: 0, // Would need EventSub for this
      chat_messages: 0, // Would need EventSub for this
      unique_chatters: 0, // Would need EventSub for this
      raids_received: 0, // Would need EventSub for this
      raids_sent: 0, // Would need EventSub for this
      updated_at: new Date().toISOString()
    }

    // Check if today's data already exists
    const { data: existing } = await supabase
      .from('stream_analytics')
      .select('id')
      .eq('broadcaster_id', userId)
      .eq('date', today)
      .single()

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('stream_analytics')
        .update(analyticsData)
        .eq('broadcaster_id', userId)
        .eq('date', today)

      if (error) {
        console.error('Error updating analytics data:', error)
        return false
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('stream_analytics')
        .insert(analyticsData)

      if (error) {
        console.error('Error inserting analytics data:', error)
        return false
      }
    }

    console.log(`Successfully collected analytics for ${user.displayName}: ${followerCount} followers, ${subscriberCount} subscribers (T1:${tier1_subs}, T2:${tier2_subs}, T3:${tier3_subs})`)
    return true

  } catch (error) {
    console.error(`Error collecting daily analytics for user ${userId}:`, error)
    return false
  }
}

// Main function to collect analytics for all users
export async function collectDailyAnalyticsForAllUsers(): Promise<void> {
  try {
    console.log('Starting daily analytics collection for all users...')

    // Get all users who have analytics access enabled
    const { data: users, error } = await supabase
      .from('analytics_access')
      .select('user_id, user_name')
      .eq('enabled', true)

    if (error) {
      console.error('Error fetching users for analytics collection:', error)
      return
    }

    if (!users || users.length === 0) {
      console.log('No users found with analytics access enabled')
      return
    }

    console.log(`Found ${users.length} users for analytics collection`)

    // Collect analytics for each user
    let successCount = 0
    let failCount = 0

    for (const user of users) {
      const success = await collectDailyAnalytics(user.user_id)
      if (success) {
        successCount++
      } else {
        failCount++
      }

      // Small delay between users to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`Daily analytics collection complete. Success: ${successCount}, Failed: ${failCount}`)

  } catch (error) {
    console.error('Error in daily analytics collection:', error)
  }
}

// Function to store user tokens when they sign in
export async function storeUserToken(userId: string, username: string, accessToken: string, refreshToken: string, expiresAt: number): Promise<void> {
  try {
    const tokenData = {
      user_id: userId,
      username: username,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      updated_at: new Date().toISOString()
    }

    // Upsert the token data
    const { error } = await supabase
      .from('user_tokens')
      .upsert(tokenData, { onConflict: 'user_id' })

    if (error) {
      console.error('Error storing user token:', error)
    } else {
      console.log(`Stored/updated token for user ${username}`)
    }
  } catch (error) {
    console.error('Error in storeUserToken:', error)
  }
}
