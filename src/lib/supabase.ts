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

export interface AnalyticsAccess {
  id?: number
  user_id: string
  user_name: string
  enabled: boolean
  granted_by?: string
  granted_at?: string
  created_at?: string
}

// TwitchTracker database interfaces
export interface TwitchTrackerChannelData {
  id?: number;
  channel_id: string;
  channel_name: string;
  display_name?: string;
  current_active_subs: number;
  paid_active_subs?: number;
  gifted_active_subs: number;
  all_time_high_subs: number;
  prime_subs?: number;
  tier1_subs?: number;
  tier2_subs?: number;
  tier3_subs?: number;
  total_followers: number;
  avg_viewers_30_days: number;
  twitch_rank?: number;
  top_percentage?: string;
  total_hours_streamed: number;
  highest_viewer_count: number;
  highest_viewer_date?: string;
  total_games_streamed: number;
  active_days_per_week: number;
  total_games_played: number;
  usual_stream_start_time?: string;
  overall_activity_days: number;
  overall_activity_total: number;
  last_live_date?: string;
  language: string;
  created_date?: string;
  partner_status: string;
  description?: string;
  data_date: string;
  collected_at?: string;
}

export interface TwitchTrackerStreamHistory {
  id?: number;
  channel_id: string;
  stream_date: string;
  title?: string;
  game_name?: string;
  duration_minutes: number;
  max_viewers: number;
  followers_gained: number;
  collected_at?: string;
}

export interface TwitchTrackerGameStats {
  id?: number;
  channel_id: string;
  game_name: string;
  game_id?: string;
  avg_viewers: number;
  total_hours_streamed: number;
  followers_gained: number;
  peak_viewers: number;
  data_date: string;
  collected_at?: string;
}

export interface TwitchTrackerSubBreakdown {
  id?: number;
  channel_id: string;
  month_year: string;
  total_subs: number;
  tier1_prime_subs: number;
  tier2_subs: number;
  tier3_subs: number;
  undefined_subs: number;
  gifted_subs: number;
  collected_at?: string;
}

export interface TwitchTrackerPerformanceMetrics {
  id?: number;
  channel_id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  avg_viewers: number;
  max_viewers: number;
  total_watch_time_hours: number;
  unique_viewers?: number;
  followers_start: number;
  followers_end: number;
  followers_gained: number;
  subs_start: number;
  subs_end: number;
  subs_gained: number;
  total_streams: number;
  total_stream_time_hours: number;
  avg_stream_duration_minutes: number;
  collected_at?: string;
}
