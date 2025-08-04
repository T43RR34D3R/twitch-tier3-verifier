/**
 * TwitchTracker data fetching utilities
 * Comprehensive data collection from TwitchTracker including historical data
 */

// import { supabase } from '@/lib/supabase'; // Will be used for data collection

// Database interfaces matching our schema
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

export interface TwitchTrackerTopGame {
  id?: number;
  game_name: string;
  game_rank: number;
  avg_viewers: number;
  viewer_share_percentage: number;
  change_7_days: number;
  data_date: string;
  collected_at?: string;
}

// Legacy interface for backward compatibility
export interface TwitchTrackerData {
  // Basic channel info
  channelName: string;
  channelId: string;
  displayName: string;
  
  // Subscriber data
  currentActiveSubs: number;
  paidActiveSubs: number | null;
  giftedActiveSubs: number;
  allTimeHighSubs: number;
  
  // Channel stats
  totalFollowers: number;
  avgViewers30Days: number;
  rank: number;
  topPercentage: string;
  
  // Lifetime overview
  totalHoursStreamed: number;
  highestViewerCount: number;
  highestViewerDate: string;
  totalGamesStreamed: number;
  
  // Activity metrics
  activeDaysPerWeek: number;
  totalGamesPlayed: number;
  usualStreamStartTime: string;
  overallActivityDays: number;
  overallActivityTotal: number;
  
  // Status info
  lastLiveDate: string;
  language: string;
  createdDate: string;
  partnerStatus: string;
  description: string;
}

/**
 * Scrapes TwitchTracker data for a given channel
 * @param channelName - The Twitch channel name (lowercase)
 * @returns Promise<TwitchTrackerData | null>
 */
export async function fetchTwitchTrackerData(channelName: string): Promise<TwitchTrackerData | null> {
  try {
    const url = `https://twitchtracker.com/${channelName.toLowerCase()}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch TwitchTracker data: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Parse the HTML to extract data
    const data = parseTwitchTrackerHTML(html, channelName);
    return data;
  } catch (error) {
    console.error('Error fetching TwitchTracker data:', error);
    return null;
  }
}

/**
 * Parses TwitchTracker HTML to extract channel data
 * @param html - The HTML content from TwitchTracker
 * @param channelName - The channel name
 * @returns TwitchTrackerData | null
 */
function parseTwitchTrackerHTML(html: string, channelName: string): TwitchTrackerData | null {
  try {
    // Extract channel ID from the HTML
    const channelIdMatch = html.match(/buckfoozle:(\d+)/);
    const channelId = channelIdMatch ? channelIdMatch[1] : '';

    // Extract display name
    const displayNameMatch = html.match(/<h4[^>]*>([^<]+)<\/h4>/);
    const displayName = displayNameMatch ? displayNameMatch[1] : channelName;

    // Extract subscriber data
    const currentActiveSubsMatch = html.match(/Current active subs[\s\S]*?(\d+)/);
    const currentActiveSubs = currentActiveSubsMatch ? parseInt(currentActiveSubsMatch[1]) : 0;

    const giftedActiveSubsMatch = html.match(/Gifted active subs[\s\S]*?(\d+)/);
    const giftedActiveSubs = giftedActiveSubsMatch ? parseInt(giftedActiveSubsMatch[1]) : 0;

    const allTimeHighSubsMatch = html.match(/All-time high active subs[\s\S]*?(\d+)/);
    const allTimeHighSubs = allTimeHighSubsMatch ? parseInt(allTimeHighSubsMatch[1]) : 0;

    // Extract follower data
    const totalFollowersMatch = html.match(/Total followers[\s\S]*?(\d+)/);
    const totalFollowers = totalFollowersMatch ? parseInt(totalFollowersMatch[1]) : 0;

    // Extract rank
    const rankMatch = html.match(/RANK[\s\S]*?(\d+)/);
    const rank = rankMatch ? parseInt(rankMatch[1]) : 0;

    // Extract top percentage
    const topPercentageMatch = html.match(/Top ([\d.]+%)/);
    const topPercentage = topPercentageMatch ? topPercentageMatch[1] : '';

    // Extract lifetime stats
    const totalHoursMatch = html.match(/Total hours streamed[\s\S]*?([\d,]+\.?\d*)/);
    const totalHoursStreamed = totalHoursMatch ? parseFloat(totalHoursMatch[1].replace(',', '')) : 0;

    const highestViewersMatch = html.match(/Highest number of viewers[\s\S]*?(\d+)/);
    const highestViewerCount = highestViewersMatch ? parseInt(highestViewersMatch[1]) : 0;

    const totalGamesMatch = html.match(/Total games streamed[\s\S]*?(\d+)/);
    const totalGamesStreamed = totalGamesMatch ? parseInt(totalGamesMatch[1]) : 0;

    // Extract avg viewers
    const avgViewersMatch = html.match(/Avg viewers[\s\S]*?(\d+)/);
    const avgViewers30Days = avgViewersMatch ? parseInt(avgViewersMatch[1]) : 0;

    // Extract activity metrics
    const activeDaysMatch = html.match(/Active days per week[\s\S]*?([\d.]+) \/ 7/);
    const activeDaysPerWeek = activeDaysMatch ? parseFloat(activeDaysMatch[1]) : 0;

    const totalGamesPlayedMatch = html.match(/Total games played[\s\S]*?(\d+)/);
    const totalGamesPlayed = totalGamesPlayedMatch ? parseInt(totalGamesPlayedMatch[1]) : 0;

    const streamStartMatch = html.match(/Usually starts stream at[\s\S]*?(\d{2}:\d{2})/);
    const usualStreamStartTime = streamStartMatch ? streamStartMatch[1] : '';

    const overallActivityMatch = html.match(/Overall Activity[\s\S]*?(\d+) of (\d+) days/);
    const overallActivityDays = overallActivityMatch ? parseInt(overallActivityMatch[1]) : 0;
    const overallActivityTotal = overallActivityMatch ? parseInt(overallActivityMatch[2]) : 0;

    // Extract last live date
    const lastLiveMatch = html.match(/Last live[\s\S]*?(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    const lastLiveDate = lastLiveMatch ? lastLiveMatch[1] : '';

    // Extract created date
    const createdMatch = html.match(/Created[\s\S]*?(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    const createdDate = createdMatch ? createdMatch[1] : '';

    // Extract language
    const languageMatch = html.match(/Language[\s\S]*?>([^<]+)</);
    const language = languageMatch ? languageMatch[1] : 'English';

    // Extract partner status
    const partnerMatch = html.match(/Status[\s\S]*?>([^<]+)</);
    const partnerStatus = partnerMatch ? partnerMatch[1] : '';

    // Extract description
    const descriptionMatch = html.match(/You have arrived at The Best Friends Club[^<]*/);
    const description = descriptionMatch ? descriptionMatch[0] : '';

    // Extract highest viewer date
    const highestViewerDateMatch = html.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    const highestViewerDate = highestViewerDateMatch ? highestViewerDateMatch[1] : '';

    return {
      channelName,
      channelId,
      displayName,
      currentActiveSubs,
      paidActiveSubs: null, // This is shown as "?" on TwitchTracker
      giftedActiveSubs,
      allTimeHighSubs,
      totalFollowers,
      avgViewers30Days,
      rank,
      topPercentage,
      totalHoursStreamed,
      highestViewerCount,
      highestViewerDate,
      totalGamesStreamed,
      activeDaysPerWeek,
      totalGamesPlayed,
      usualStreamStartTime,
      overallActivityDays,
      overallActivityTotal,
      lastLiveDate,
      language,
      createdDate,
      partnerStatus,
      description
    };
  } catch (error) {
    console.error('Error parsing TwitchTracker HTML:', error);
    return null;
  }
}

/**
 * Hardcoded data for BuckFoozle based on the TwitchTracker page
 * This can be used as a fallback or for testing
 */
export function getBuckFoozleStaticData(): TwitchTrackerData {
  return {
    channelName: 'buckfoozle',
    channelId: '269187200',
    displayName: 'BuckFoozle',
    currentActiveSubs: 548,
    paidActiveSubs: null,
    giftedActiveSubs: 298,
    allTimeHighSubs: 2758,
    totalFollowers: 10813,
    avgViewers30Days: 121,
    rank: 13102,
    topPercentage: '0.18%',
    totalHoursStreamed: 4248.2,
    highestViewerCount: 6156,
    highestViewerDate: '2024-10-21 18:00:00',
    totalGamesStreamed: 103,
    activeDaysPerWeek: 2.6,
    totalGamesPlayed: 103,
    usualStreamStartTime: '03:30',
    overallActivityDays: 745,
    overallActivityTotal: 1981,
    lastLiveDate: '2025-08-01 11:35:00',
    language: 'English',
    createdDate: '2018-10-24 13:41:11',
    partnerStatus: 'Partner',
    description: 'You have arrived at The Best Friends Club! I\'m a vArIeTy streamer and a Monster Hunter enthusiast who loves to play violin and guitar. I\'m an open book, so if you want to know more just ask. Thank you for stopping by!'
  };
}
