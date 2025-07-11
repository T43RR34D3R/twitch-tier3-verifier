import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface VerificationLog {
  id?: number
  user_name: string
  user_id: string
  timestamp?: string
  success: boolean
  message: string
  created_at?: string
}

export interface PageSettings {
  id?: number
  title: string
  subtitle: string
  sign_in_text: string
  steps: string[]
  updated_at?: string
}

// Analytics interfaces
export interface StreamAnalytics {
  id?: number
  broadcaster_id: string
  broadcaster_name: string
  date: string
  total_stream_time_minutes: number
  peak_viewers: number
  average_viewers: number
  follower_count: number
  subscriber_count: number
  tier1_subs: number
  tier2_subs: number
  tier3_subs: number
  total_bits: number
  chat_messages: number
  unique_chatters: number
  raids_received: number
  raids_sent: number
  created_at?: string
  updated_at?: string
}

export interface SubscriptionHistory {
  id?: number
  broadcaster_id: string
  subscriber_id: string
  subscriber_name: string
  tier: number
  event_type: string
  months_subscribed: number
  cumulative_months: number
  streak_months: number
  is_gift: boolean
  gifter_id?: string
  gifter_name?: string
  created_at?: string
}

export interface StreamSession {
  id?: number
  broadcaster_id: string
  stream_id: string
  title?: string
  game_name?: string
  game_id?: string
  started_at: string
  ended_at?: string
  duration_minutes?: number
  peak_viewers: number
  average_viewers: number
  total_bits: number
  new_followers: number
  new_subscribers: number
  created_at?: string
}

export interface ChatAnalytics {
  id?: number
  broadcaster_id: string
  date: string
  total_messages: number
  unique_chatters: number
  average_messages_per_hour: number
  top_chatters: Record<string, number> | null
  most_used_emotes: Record<string, number> | null
  created_at?: string
}
