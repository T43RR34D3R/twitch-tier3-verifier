import { NextRequest, NextResponse } from 'next/server';
import { fetchTwitchTrackerData, getBuckFoozleStaticData } from '@/lib/twitchtracker';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelName = searchParams.get('channel') || 'buckfoozle';
    const channelId = searchParams.get('channel_id') || '269187200';
    const useStatic = searchParams.get('static') === 'true';

    // Creating Supabase client for server
    const supabase = createServerSupabaseClient();
    
    // Get TwitchTracker data
    let twitchTrackerData;
    
    if (useStatic || channelName.toLowerCase() === 'buckfoozle') {
      twitchTrackerData = getBuckFoozleStaticData();
    } else {
      twitchTrackerData = await fetchTwitchTrackerData(channelName);
      if (!twitchTrackerData) {
        throw new Error('Failed to fetch TwitchTracker data');
      }
    }

    const today = new Date().toISOString().split('T')[0];

    console.log('TwitchTracker data to store:', twitchTrackerData);
    
    // Store channel data
    const channelDataResult = await supabase
      .from('twitchtracker_channel_data')
      .upsert({
        channel_id: channelId,
        channel_name: channelName,
        display_name: twitchTrackerData.displayName || channelName,
        current_active_subs: twitchTrackerData.currentActiveSubs || 0,
        paid_active_subs: twitchTrackerData.paidActiveSubs,
        gifted_active_subs: twitchTrackerData.giftedActiveSubs || 0,
        all_time_high_subs: twitchTrackerData.allTimeHighSubs || 0,
        prime_subs: null, // Not available in current data
        tier1_subs: null, // Not available in current data
        tier2_subs: null, // Not available in current data
        tier3_subs: null, // Not available in current data
        total_followers: twitchTrackerData.totalFollowers || 0,
        avg_viewers_30_days: twitchTrackerData.avgViewers30Days || 0,
        twitch_rank: twitchTrackerData.rank || null,
        top_percentage: twitchTrackerData.topPercentage || null,
        total_hours_streamed: twitchTrackerData.totalHoursStreamed || 0,
        highest_viewer_count: twitchTrackerData.highestViewerCount || 0,
        total_games_streamed: twitchTrackerData.totalGamesStreamed || 0,
        language: twitchTrackerData.language || 'English',
        partner_status: twitchTrackerData.partnerStatus || null,
        data_date: today,
        collected_at: new Date().toISOString()
      }, {
        onConflict: 'channel_id,data_date'
      });

    if (channelDataResult.error) {
      console.error('Error storing channel data:', channelDataResult.error);
      throw new Error(`Failed to store channel data: ${channelDataResult.error.message}`);
    }
    
    console.log('Channel data stored successfully');
    console.log('Generated historical data points:', {
      channelData: 30,
      gameStats: 7,
      subBreakdown: 12,
      streamHistory: 'variable'
    });

    // Generate some sample historical data for demonstration
    // In a real implementation, you'd collect this over time
    const historicalData = generateSampleHistoricalData(twitchTrackerData, channelId, channelName);
    
    // Store historical channel data
    for (const dayData of historicalData.channelData) {
      await supabase
        .from('twitchtracker_channel_data')
        .upsert(dayData, { onConflict: 'channel_id,data_date' });
    }

    // Store sample game stats
    for (const gameData of historicalData.gameStats) {
      await supabase
        .from('twitchtracker_game_stats')
        .upsert(gameData, { onConflict: 'channel_id,game_name,data_date' });
    }

    // Store sample subscriber breakdown
    for (const subData of historicalData.subBreakdown) {
      await supabase
        .from('twitchtracker_sub_breakdown')
        .upsert(subData, { onConflict: 'channel_id,month_year' });
    }

    // Store sample stream history
    for (const streamData of historicalData.streamHistory) {
      await supabase
        .from('twitchtracker_stream_history')
        .upsert(streamData, { onConflict: 'channel_id,stream_date' });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'TwitchTracker data collected and stored successfully',
      dataPoints: {
        channelData: historicalData.channelData.length,
        gameStats: historicalData.gameStats.length,
        subBreakdown: historicalData.subBreakdown.length,
        streamHistory: historicalData.streamHistory.length
      }
    });

  } catch (error) {
    console.error('TwitchTracker collection error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to collect TwitchTracker data' 
    }, { status: 500 });
  }
}

// Generate sample historical data based on current data
function generateSampleHistoricalData(currentData: {
  displayName?: string;
  currentActiveSubs?: number;
  totalFollowers?: number;
  avgViewers30Days?: number;
  rank?: number;
  topPercentage?: string;
  totalHoursStreamed?: number;
}, channelId: string, channelName: string) {
  const today = new Date();
  const channelData: Record<string, unknown>[] = [];
  const gameStats: Record<string, unknown>[] = [];
  const subBreakdown: Record<string, unknown>[] = [];
  const streamHistory: Record<string, unknown>[] = [];

  // Current values as baseline
  const currentSubs = currentData.currentActiveSubs || 100;
  const currentFollowers = currentData.totalFollowers || 1000;
  const currentViewers = currentData.avgViewers30Days || 50;

  // Generate 30 days of historical channel data with realistic growth
  let cumulativeSubGrowth = 0;
  let cumulativeFollowerGrowth = 0;
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Realistic daily growth (small increments only)
    const dailySubGrowth = Math.random() < 0.7 ? Math.floor(Math.random() * 3) : 0; // 0-2 new subs most days
    const dailyFollowerGrowth = Math.random() < 0.8 ? Math.floor(Math.random() * 15) + 1 : 0; // 1-15 new followers most days
    
    cumulativeSubGrowth += dailySubGrowth;
    cumulativeFollowerGrowth += dailyFollowerGrowth;
    
    // Calculate historical values (current - remaining growth)
    const remainingDays = i;
    const avgDailySubGrowth = cumulativeSubGrowth / (30 - remainingDays) || 0;
    const avgDailyFollowerGrowth = cumulativeFollowerGrowth / (30 - remainingDays) || 0;
    
    const historicalSubs = Math.max(currentSubs - (avgDailySubGrowth * remainingDays), currentSubs * 0.9);
    const historicalFollowers = Math.max(currentFollowers - (avgDailyFollowerGrowth * remainingDays), currentFollowers * 0.95);
    
    // Small daily variations (±2% max)
    const subVariation = 0.98 + Math.random() * 0.04;
    const followerVariation = 0.99 + Math.random() * 0.02;
    const viewerVariation = 0.95 + Math.random() * 0.1;

    channelData.push({
      channel_id: channelId,
      channel_name: channelName,
      display_name: currentData.displayName || channelName,
      current_active_subs: Math.round(historicalSubs * subVariation),
      total_followers: Math.round(historicalFollowers * followerVariation),
      avg_viewers_30_days: Math.round(currentViewers * viewerVariation),
      twitch_rank: currentData.rank || Math.floor(Math.random() * 1000) + 5000,
      top_percentage: currentData.topPercentage || '1%',
      total_hours_streamed: Math.max((currentData.totalHoursStreamed || 100) - (remainingDays * 0.1), 50),
      data_date: dateStr,
      collected_at: new Date().toISOString()
    });
  }

  // Generate sample game stats
  const sampleGames = [
    'Grand Theft Auto V', 'World of Warcraft', 'League of Legends', 
    'Fortnite', 'Minecraft', 'Call of Duty: Warzone', 'Apex Legends'
  ];

  sampleGames.forEach((gameName) => {
    gameStats.push({
      channel_id: channelId,
      game_name: gameName,
      avg_viewers: Math.floor(Math.random() * 200) + 50,
      total_hours_streamed: Math.floor(Math.random() * 50) + 10,
      followers_gained: Math.floor(Math.random() * 100) + 10,
      peak_viewers: Math.floor(Math.random() * 500) + 100,
      data_date: today.toISOString().split('T')[0],
      collected_at: new Date().toISOString()
    });
  });

  // Generate subscriber breakdown for last 12 months with gradual growth
  const currentSubCount = currentData.currentActiveSubs || 100;
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);
    const monthYear = date.toISOString().substring(0, 7); // YYYY-MM format

    // Calculate historical subscriber count with gradual growth
    // Assume 2-8% monthly growth, working backwards
    const monthsAgo = i;
    const growthRate = 0.02 + (Math.random() * 0.06); // 2-8% monthly growth
    const totalGrowthFactor = Math.pow(1 + growthRate, monthsAgo);
    const historicalSubs = Math.round(currentSubCount / totalGrowthFactor);
    
    // Ensure minimum values and some variation
    const finalSubCount = Math.max(historicalSubs, Math.round(currentSubCount * 0.7));
    
    subBreakdown.push({
      channel_id: channelId,
      month_year: monthYear,
      total_subs: finalSubCount,
      tier1_prime_subs: Math.round(finalSubCount * 0.8),
      tier2_subs: Math.round(finalSubCount * 0.15),
      tier3_subs: Math.round(finalSubCount * 0.05),
      gifted_subs: Math.round(finalSubCount * 0.3),
      undefined_subs: 0,
      collected_at: new Date().toISOString()
    });
  }

  // Generate sample stream history
  for (let i = 14; i >= 0; i--) {
    // Generate 2-3 streams per week
    if (Math.random() > 0.4) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(Math.floor(Math.random() * 8) + 16); // Stream between 4PM-12AM
      
      const gameIndex = Math.floor(Math.random() * sampleGames.length);
      
      streamHistory.push({
        channel_id: channelId,
        stream_date: date.toISOString(),
        title: `Playing ${sampleGames[gameIndex]} - Come hang out!`,
        game_name: sampleGames[gameIndex],
        duration_minutes: Math.floor(Math.random() * 180) + 60, // 1-4 hours
        max_viewers: Math.floor(Math.random() * 300) + 50,
        followers_gained: Math.floor(Math.random() * 20) + 1,
        collected_at: new Date().toISOString()
      });
    }
  }

  return {
    channelData,
    gameStats,
    subBreakdown,
    streamHistory
  };
}
