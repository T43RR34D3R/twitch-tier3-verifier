import { NextRequest, NextResponse } from 'next/server';

// Import the channelHighlights from the main highlights route
// In a real app, this would be in a shared database/store
const channelHighlights = new Map<string, Map<string, {
  id: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: number;
  color: string;
  badges: string[];
  source?: string;
}>>();

// Make sure this shares the same storage as [channel]/route.ts
// In production, you'd use Redis, database, or other shared storage

export async function GET() {
  try {
    const channels = Array.from(channelHighlights.keys());
    const stats = channels.map(channel => {
      const highlights = channelHighlights.get(channel);
      const highlightArray = Array.from(highlights?.values() || []);
      
      return {
        channel,
        highlightCount: highlightArray.length,
        lastActivity: highlightArray.length > 0 
          ? Math.max(...highlightArray.map(h => h.timestamp))
          : 0
      };
    });

    return NextResponse.json({ 
      totalChannels: channels.length,
      totalHighlights: stats.reduce((sum, s) => sum + s.highlightCount, 0),
      channels: stats.sort((a, b) => b.lastActivity - a.lastActivity)
    });
  } catch (error) {
    console.error('Error fetching highlight stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  // This is what the demo page calls
  return GET();
}
