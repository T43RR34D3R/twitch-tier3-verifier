import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Store highlighted messages (in production, use Redis or database)
const highlightedMessages = new Map<string, {
  id: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: number;
  color: string;
  badges: string[];
}>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  
  if (type === 'highlights') {
    // Return highlighted messages for OBS overlay
    const highlights = Array.from(highlightedMessages.values());
    return NextResponse.json({ highlights });
  }
  
  return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, messageId, messageData } = body;

    if (action === 'highlight') {
      // Add message to highlights
      if (messageData) {
        highlightedMessages.set(messageId, {
          id: messageId,
          username: messageData.username,
          displayName: messageData.displayName || messageData.username,
          message: messageData.message,
          timestamp: messageData.timestamp || Date.now(),
          color: messageData.color || '#ffffff',
          badges: messageData.badges || []
        });
      }
      return NextResponse.json({ success: true, action: 'highlighted' });
    }

    if (action === 'unhighlight') {
      // Remove message from highlights
      highlightedMessages.delete(messageId);
      return NextResponse.json({ success: true, action: 'unhighlighted' });
    }

    if (action === 'mod_action') {
      // Handle moderator actions
      const { type, username, duration, reason, channel } = body;
      
      // Check if user has mod permissions
      const isUserMod = session.user.name && ['TearReader', 'BuckFoozle'].includes(session.user.name);
      if (!isUserMod) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }

      // In a real implementation, you would use Twitch API to perform mod actions
      // For now, we'll just return success to indicate the action was received
      console.log(`Mod action: ${type} on ${username} in ${channel}`, { duration, reason });
      
      return NextResponse.json({ 
        success: true, 
        action: 'mod_action_executed',
        details: { type, username, duration, reason }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    
    if (messageId) {
      highlightedMessages.delete(messageId);
    } else {
      // Clear all highlights
      highlightedMessages.clear();
    }

    return NextResponse.json({ success: true, action: 'cleared' });

  } catch (error) {
    console.error('Chat delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
