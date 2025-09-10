import { NextRequest, NextResponse } from 'next/server';

// Store highlighted messages per channel (in production, use Redis or database)
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

// Helper to get or create channel highlights
function getChannelHighlights(channel: string) {
  if (!channelHighlights.has(channel)) {
    channelHighlights.set(channel, new Map());
  }
  return channelHighlights.get(channel)!;
}

// GET /api/highlights/[channel] - Fetch highlights for a channel
export async function GET(
  request: NextRequest,
  { params }: { params: { channel: string } }
) {
  try {
    const channel = params.channel.toLowerCase();
    const highlights = getChannelHighlights(channel);
    const highlightArray = Array.from(highlights.values())
      .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
      .slice(0, 50); // Limit to 50 most recent highlights

    return NextResponse.json(highlightArray);
  } catch (error) {
    console.error('Error fetching highlights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/highlights/[channel] - Add a highlight for a channel
export async function POST(
  request: NextRequest,
  { params }: { params: { channel: string } }
) {
  try {
    const channel = params.channel.toLowerCase();
    const body = await request.json();
    
    // Validate required fields
    if (!body.id || !body.username || !body.message) {
      return NextResponse.json({ 
        error: 'Missing required fields: id, username, message' 
      }, { status: 400 });
    }

    const highlights = getChannelHighlights(channel);
    
    const highlight = {
      id: body.id,
      username: body.username.toLowerCase(),
      displayName: body.displayName || body.username,
      message: body.message,
      timestamp: body.timestamp || Date.now(),
      color: body.color || '#ffffff',
      badges: body.badges || [],
      source: body.source || 'extension'
    };

    highlights.set(body.id, highlight);
    
    // Keep only the most recent 100 highlights per channel
    if (highlights.size > 100) {
      const sortedHighlights = Array.from(highlights.entries())
        .sort(([, a], [, b]) => b.timestamp - a.timestamp);
      
      const toKeep = sortedHighlights.slice(0, 100);
      highlights.clear();
      toKeep.forEach(([id, highlight]) => {
        highlights.set(id, highlight);
      });
    }

    console.log(`✅ Highlight added to channel ${channel}:`, highlight);
    return NextResponse.json({ success: true, highlight });

  } catch (error) {
    console.error('Error adding highlight:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/highlights/[channel] - Clear all highlights for a channel
// DELETE /api/highlights/[channel]?id=messageId - Remove specific highlight
export async function DELETE(
  request: NextRequest,
  { params }: { params: { channel: string } }
) {
  try {
    const channel = params.channel.toLowerCase();
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');
    
    const highlights = getChannelHighlights(channel);
    
    if (messageId) {
      // Remove specific highlight
      const removed = highlights.delete(messageId);
      if (removed) {
        console.log(`🗑️ Highlight removed from channel ${channel}: ${messageId}`);
        return NextResponse.json({ success: true, action: 'removed', messageId });
      } else {
        return NextResponse.json({ error: 'Highlight not found' }, { status: 404 });
      }
    } else {
      // Clear all highlights for channel
      const count = highlights.size;
      highlights.clear();
      console.log(`🗑️ All highlights cleared for channel ${channel} (${count} items)`);
      return NextResponse.json({ success: true, action: 'cleared', count });
    }

  } catch (error) {
    console.error('Error deleting highlights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper endpoint to get all channels with highlights (for debugging)
export async function OPTIONS(request: NextRequest) {
  const channels = Array.from(channelHighlights.keys());
  const stats = channels.map(channel => ({
    channel,
    highlightCount: channelHighlights.get(channel)?.size || 0,
    lastActivity: Math.max(
      ...Array.from(channelHighlights.get(channel)?.values() || [])
        .map(h => h.timestamp)
    )
  }));

  return NextResponse.json({ 
    totalChannels: channels.length,
    channels: stats
  });
}
