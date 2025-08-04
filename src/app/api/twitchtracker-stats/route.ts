import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    const channelId = searchParams.get('channel_id') || '269187200';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '30');

    // Default to last 30 days if no dates provided
    const defaultEndDate = new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const actualStartDate = startDate || defaultStartDate;
    const actualEndDate = endDate || defaultEndDate;

    switch (type) {
      case 'summary':
        return handleSummaryStats(channelId, actualStartDate, actualEndDate);
      
      case 'daily':
        return handleDailyStats(channelId, actualStartDate, actualEndDate);
      
      case 'games':
        return handleGameStats(channelId, actualStartDate, actualEndDate, limit);
      
      case 'streams':
        return handleStreamHistory(channelId, actualStartDate, actualEndDate, limit);
      
      case 'subscribers':
        return handleSubscriberStats(channelId, actualStartDate, actualEndDate);
      
      case 'performance':
        return handlePerformanceMetrics(channelId, actualStartDate, actualEndDate);

      case 'day-of-week':
        return handleDayOfWeekStats(channelId, actualStartDate, actualEndDate);
      
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid type parameter' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('TwitchTracker stats API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

async function handleSummaryStats(channelId: string, startDate: string, endDate: string) {
  try {
    // Get channel data over time
    const { data: channelData, error: channelError } = await supabase
      .from('twitchtracker_channel_data')
      .select('*')
      .eq('channel_id', channelId)
      .gte('data_date', startDate)
      .lte('data_date', endDate)
      .order('data_date', { ascending: true });

    if (channelError) throw channelError;

    // Get stream history
    const { data: streamData, error: streamError } = await supabase
      .from('twitchtracker_stream_history')
      .select('*')
      .eq('channel_id', channelId)
      .gte('stream_date', startDate)
      .lte('stream_date', endDate)
      .order('stream_date', { ascending: true });

    if (streamError) throw streamError;

    // Get performance metrics
    const { data: performanceData, error: performanceError } = await supabase
      .from('twitchtracker_performance_metrics')
      .select('*')
      .eq('channel_id', channelId)
      .gte('period_start', startDate)
      .lte('period_end', endDate)
      .order('period_start', { ascending: true });

    if (performanceError) throw performanceError;

    return NextResponse.json({
      success: true,
      data: {
        channel: channelData || [],
        streams: streamData || [],
        performance: performanceData || [],
        dateRange: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch summary statistics' 
    }, { status: 500 });
  }
}

async function handleDailyStats(channelId: string, startDate: string, endDate: string) {
  try {
    const { data, error } = await supabase
      .from('twitchtracker_channel_data')
      .select('*')
      .eq('channel_id', channelId)
      .gte('data_date', startDate)
      .lte('data_date', endDate)
      .order('data_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch daily statistics' 
    }, { status: 500 });
  }
}

async function handleGameStats(channelId: string, startDate: string, endDate: string, limit: number) {
  try {
    const { data, error } = await supabase
      .from('twitchtracker_game_stats')
      .select('*')
      .eq('channel_id', channelId)
      .gte('data_date', startDate)
      .lte('data_date', endDate)
      .order('total_hours_streamed', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Group by game and aggregate data
    const gameMap = new Map();
    (data || []).forEach(game => {
      if (gameMap.has(game.game_name)) {
        const existing = gameMap.get(game.game_name);
        existing.total_hours_streamed += game.total_hours_streamed;
        existing.avg_viewers = Math.max(existing.avg_viewers, game.avg_viewers);
        existing.peak_viewers = Math.max(existing.peak_viewers, game.peak_viewers);
        existing.followers_gained += game.followers_gained;
      } else {
        gameMap.set(game.game_name, { ...game });
      }
    });

    const aggregatedGames = Array.from(gameMap.values())
      .sort((a, b) => b.total_hours_streamed - a.total_hours_streamed);

    return NextResponse.json({
      success: true,
      data: aggregatedGames,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Error fetching game stats:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch game statistics' 
    }, { status: 500 });
  }
}

async function handleStreamHistory(channelId: string, startDate: string, endDate: string, limit: number) {
  try {
    const { data, error } = await supabase
      .from('twitchtracker_stream_history')
      .select('*')
      .eq('channel_id', channelId)
      .gte('stream_date', startDate)
      .lte('stream_date', endDate)
      .order('stream_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Error fetching stream history:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch stream history' 
    }, { status: 500 });
  }
}

async function handleSubscriberStats(channelId: string, startDate: string, endDate: string) {
  try {
    const { data, error } = await supabase
      .from('twitchtracker_sub_breakdown')
      .select('*')
      .eq('channel_id', channelId)
      .gte('month_year', startDate.substring(0, 7)) // Convert to YYYY-MM format
      .lte('month_year', endDate.substring(0, 7))
      .order('month_year', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Error fetching subscriber stats:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch subscriber statistics' 
    }, { status: 500 });
  }
}

async function handlePerformanceMetrics(channelId: string, startDate: string, endDate: string) {
  try {
    const { data, error } = await supabase
      .from('twitchtracker_performance_metrics')
      .select('*')
      .eq('channel_id', channelId)
      .gte('period_start', startDate)
      .lte('period_end', endDate)
      .order('period_start', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch performance metrics' 
    }, { status: 500 });
  }
}

async function handleDayOfWeekStats(channelId: string, startDate: string, endDate: string) {
  try {
    // Get stream history and group by day of week
    const { data: streamData, error } = await supabase
      .from('twitchtracker_stream_history')
      .select('*')
      .eq('channel_id', channelId)
      .gte('stream_date', startDate)
      .lte('stream_date', endDate)
      .order('stream_date', { ascending: true });

    if (error) throw error;

    // Group by day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeekStats: Record<string, { streams: number; totalViewers: number; totalDuration: number; avgViewers: number }> = {
      Sunday: { streams: 0, totalViewers: 0, totalDuration: 0, avgViewers: 0 },
      Monday: { streams: 0, totalViewers: 0, totalDuration: 0, avgViewers: 0 },
      Tuesday: { streams: 0, totalViewers: 0, totalDuration: 0, avgViewers: 0 },
      Wednesday: { streams: 0, totalViewers: 0, totalDuration: 0, avgViewers: 0 },
      Thursday: { streams: 0, totalViewers: 0, totalDuration: 0, avgViewers: 0 },
      Friday: { streams: 0, totalViewers: 0, totalDuration: 0, avgViewers: 0 },
      Saturday: { streams: 0, totalViewers: 0, totalDuration: 0, avgViewers: 0 }
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    (streamData || []).forEach(stream => {
      const date = new Date(stream.stream_date);
      const dayName = dayNames[date.getDay()];
      
      dayOfWeekStats[dayName].streams++;
      dayOfWeekStats[dayName].totalViewers += stream.max_viewers;
      dayOfWeekStats[dayName].totalDuration += stream.duration_minutes;
    });

    // Calculate averages
    Object.keys(dayOfWeekStats).forEach(day => {
      const stats = dayOfWeekStats[day];
      if (stats.streams > 0) {
        stats.avgViewers = Math.round(stats.totalViewers / stats.streams);
      }
    });

    return NextResponse.json({
      success: true,
      data: dayOfWeekStats,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Error fetching day of week stats:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch day of week statistics' 
    }, { status: 500 });
  }
}
