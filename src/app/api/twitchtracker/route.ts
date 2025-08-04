import { NextRequest, NextResponse } from 'next/server';
import { fetchTwitchTrackerData, getBuckFoozleStaticData } from '@/lib/twitchtracker';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelName = searchParams.get('channel') || 'buckfoozle';
    const useStatic = searchParams.get('static') === 'true';

    if (useStatic || channelName.toLowerCase() === 'buckfoozle') {
      // Use static data for BuckFoozle to avoid rate limiting issues
      const data = getBuckFoozleStaticData();
      return NextResponse.json({ success: true, data });
    }

    // For other channels, try to fetch live data
    const data = await fetchTwitchTrackerData(channelName);
    
    if (!data) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch TwitchTracker data' 
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('TwitchTracker API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
