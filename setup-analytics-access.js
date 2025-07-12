const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your .env file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupAnalyticsAccess() {
  try {
    console.log('Setting up analytics access...')
    
    // First, let's check what user IDs we have in the database
    const { data: existingAccess, error: accessError } = await supabase
      .from('analytics_access')
      .select('*')
    
    if (accessError) {
      console.error('Error fetching existing access:', accessError)
      return
    }
    
    console.log('Current analytics_access entries:')
    console.table(existingAccess)
    
    // Prompt user for their Twitch user ID
    console.log('\nTo find your Twitch user ID:')
    console.log('1. Log into your app and check the browser console')
    console.log('2. Or visit: https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/')
    console.log('3. Enter your Twitch username to get your user ID')
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    readline.question('Enter your Twitch user ID: ', async (userId) => {
      if (!userId || userId.trim() === '') {
        console.log('No user ID provided. Exiting.')
        readline.close()
        return
      }
      
      userId = userId.trim()
      
      // Check if user already has access
      const { data: existingUser } = await supabase
        .from('analytics_access')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (existingUser) {
        console.log(`User ${userId} already has analytics access:`, existingUser)
        
        // Update to enabled if not already
        if (!existingUser.enabled) {
          const { error: updateError } = await supabase
            .from('analytics_access')
            .update({ enabled: true })
            .eq('user_id', userId)
          
          if (updateError) {
            console.error('Error updating access:', updateError)
          } else {
            console.log('Analytics access enabled for user:', userId)
          }
        }
      } else {
        // Add new user with analytics access
        const { error: insertError } = await supabase
          .from('analytics_access')
          .insert([
            {
              user_id: userId,
              enabled: true,
              created_at: new Date().toISOString()
            }
          ])
        
        if (insertError) {
          console.error('Error adding analytics access:', insertError)
        } else {
          console.log('Analytics access granted to user:', userId)
        }
      }
      
      // Now let's add some sample data for this user
      await addSampleData(userId)
      
      readline.close()
    })
    
  } catch (error) {
    console.error('Error setting up analytics access:', error)
  }
}

async function addSampleData(userId) {
  console.log('\nAdding sample analytics data...')
  
  try {
    // Add stream analytics data
    const { error: streamError } = await supabase
      .from('stream_analytics')
      .upsert([
        {
          broadcaster_id: userId,
          date: new Date().toISOString().split('T')[0],
          total_viewers: 45,
          unique_viewers: 38,
          average_viewers: 25,
          max_viewers: 67,
          stream_duration: 180, // 3 hours
          created_at: new Date().toISOString()
        },
        {
          broadcaster_id: userId,
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
          total_viewers: 52,
          unique_viewers: 41,
          average_viewers: 32,
          max_viewers: 78,
          stream_duration: 240, // 4 hours
          created_at: new Date().toISOString()
        }
      ])
    
    if (streamError) {
      console.error('Error adding stream data:', streamError)
    } else {
      console.log('✓ Stream analytics data added')
    }
    
    // Add chat analytics data
    const { error: chatError } = await supabase
      .from('chat_analytics')
      .upsert([
        {
          broadcaster_id: userId,
          date: new Date().toISOString().split('T')[0],
          total_messages: 1250,
          unique_chatters: 28,
          average_messages_per_minute: 8.5,
          created_at: new Date().toISOString()
        },
        {
          broadcaster_id: userId,
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          total_messages: 1480,
          unique_chatters: 35,
          average_messages_per_minute: 9.2,
          created_at: new Date().toISOString()
        }
      ])
    
    if (chatError) {
      console.error('Error adding chat data:', chatError)
    } else {
      console.log('✓ Chat analytics data added')
    }
    
    // Add follower data
    const { error: followerError } = await supabase
      .from('follower_history')
      .upsert([
        {
          broadcaster_id: userId,
          date: new Date().toISOString().split('T')[0],
          follower_count: 1250,
          new_followers: 15,
          created_at: new Date().toISOString()
        },
        {
          broadcaster_id: userId,
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          follower_count: 1235,
          new_followers: 12,
          created_at: new Date().toISOString()
        }
      ])
    
    if (followerError) {
      console.error('Error adding follower data:', followerError)
    } else {
      console.log('✓ Follower data added')
    }
    
    // Add stream sessions
    const { error: sessionError } = await supabase
      .from('stream_sessions')
      .upsert([
        {
          broadcaster_id: userId,
          session_id: `session_${Date.now()}`,
          start_time: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
          end_time: new Date().toISOString(),
          peak_viewers: 67,
          average_viewers: 25,
          category: 'Just Chatting',
          created_at: new Date().toISOString()
        }
      ])
    
    if (sessionError) {
      console.error('Error adding session data:', sessionError)
    } else {
      console.log('✓ Stream session data added')
    }
    
    console.log('\n✅ Sample data setup complete!')
    console.log('You should now see analytics data when you visit your dashboard.')
    
  } catch (error) {
    console.error('Error adding sample data:', error)
  }
}

setupAnalyticsAccess()
