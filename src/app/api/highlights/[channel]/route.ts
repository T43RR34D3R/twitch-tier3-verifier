import { NextRequest, NextResponse } from 'next/server';
import { HighlightsDB } from '../../../../lib/railway-db';

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

// GET /api/highlights/[channel] - Fetch highlights for a channel
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ channel: string }> }
) {
  const params = await context.params;
  try {
    const channel = params.channel.toLowerCase();
    const highlights = await HighlightsDB.getChannelHighlights(channel, 50);

    // Convert database format to API format for backwards compatibility
    const highlightArray = highlights.map(highlight => ({
      id: highlight.message_id,
      username: highlight.username,
      displayName: highlight.display_name,
      message: highlight.message,
      timestamp: highlight.timestamp,
      color: highlight.color,
      badges: highlight.badges,
      source: highlight.source
    }));

    const response = NextResponse.json(highlightArray);
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Error fetching highlights:', error);
    const errorResponse = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(errorResponse);
  }
}

// POST /api/highlights/[channel] - Toggle highlight for a channel (add if doesn't exist, remove if exists)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ channel: string }> }
) {
  const params = await context.params;
  try {
    const channel = params.channel.toLowerCase();
    const body = await request.json();
    
    // Validate required fields
    if (!body.id || !body.username || !body.message) {
      const errorResponse = NextResponse.json({ 
        error: 'Missing required fields: id, username, message' 
      }, { status: 400 });
      return addCorsHeaders(errorResponse);
    }

    const highlight = {
      message_id: body.id,
      channel: channel,
      username: body.username.toLowerCase(),
      display_name: body.displayName || body.username,
      message: body.message,
      timestamp: body.timestamp || Date.now(),
      color: body.color || '#ffffff',
      badges: body.badges || [],
      source: body.source || 'extension'
    };

    // Toggle the highlight (add if doesn't exist, remove if exists)
    const result = await HighlightsDB.toggleHighlight(highlight);
    
    if (result.action === 'added') {
      console.log(`✅ Highlight added to channel ${channel}:`, result.highlight);
      const response = NextResponse.json({ 
        success: true, 
        action: 'added',
        highlight: {
          id: result.highlight!.message_id,
          username: result.highlight!.username,
          displayName: result.highlight!.display_name,
          message: result.highlight!.message,
          timestamp: result.highlight!.timestamp,
          color: result.highlight!.color,
          badges: result.highlight!.badges,
          source: result.highlight!.source
        }
      });
      return addCorsHeaders(response);
    } else {
      console.log(`🗑️ Highlight removed from channel ${channel}:`, body.id);
      const response = NextResponse.json({ 
        success: true, 
        action: 'removed',
        messageId: body.id
      });
      return addCorsHeaders(response);
    }

  } catch (error) {
    console.error('Error toggling highlight:', error);
    const errorResponse = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(errorResponse);
  }
}

// DELETE /api/highlights/[channel] - Clear all highlights for a channel
// DELETE /api/highlights/[channel]?id=messageId - Remove specific highlight
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ channel: string }> }
) {
  const params = await context.params;
  try {
    const channel = params.channel.toLowerCase();
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');
    
    if (messageId) {
      // Remove specific highlight
      const removed = await HighlightsDB.removeHighlight(messageId);
      if (removed) {
        console.log(`🗑️ Highlight removed from channel ${channel}: ${messageId}`);
        
        const response = NextResponse.json({ success: true, action: 'removed', messageId });
        return addCorsHeaders(response);
      } else {
        const response = NextResponse.json({ error: 'Highlight not found' }, { status: 404 });
        return addCorsHeaders(response);
      }
    } else {
      // Clear all highlights for channel
      const count = await HighlightsDB.clearChannelHighlights(channel);
      console.log(`🗑️ All highlights cleared for channel ${channel} (${count} items)`);
      
      const response = NextResponse.json({ success: true, action: 'cleared', count });
      return addCorsHeaders(response);
    }

  } catch (error) {
    console.error('Error deleting highlights:', error);
    const errorResponse = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(errorResponse);
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Max-Age', '86400');
  return addCorsHeaders(response);
}
