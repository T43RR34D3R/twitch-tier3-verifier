import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

interface ChatMessage {
  id: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: number;
  badges: string[];
  emotes: string[];
  color: string;
  isMod: boolean;
  isVip: boolean;
  isSubscriber: boolean;
}

interface ChatAnalytics {
  messageCount: number;
  uniqueUsers: string[];
  emoteCount: number;
  averageMessageLength: number;
  messageRate: number;
  popularEmotes: Array<{ emote: string; count: number }>;
  popularWords: Array<{ word: string; count: number }>;
  userActivity: Array<{ username: string; messageCount: number; lastSeen: number }>;
  hourlyActivity: Array<{ hour: number; count: number }>;
  chatMood: 'positive' | 'negative' | 'neutral';
  topChatters: Array<{ username: string; messageCount: number; badges: string[] }>;
}

// Simulated chat data store (in production, use Redis or similar)
const chatData = new Map<string, ChatMessage[]>();
const analytics = new Map<string, ChatAnalytics>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel') || 'buckfoozle';
    const timeRange = searchParams.get('range') || '1h'; // 1h, 6h, 24h, 7d
    
    // Get stored analytics for the channel (for future use)
    // const channelAnalytics = analytics.get(channel) || {...};

    // Simulate real-time data updates
    const now = Date.now();
    const messages = chatData.get(channel) || [];
    
    // Filter messages by time range
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    }[timeRange] || 60 * 60 * 1000;
    
    const filteredMessages = messages.filter(msg => 
      now - msg.timestamp <= timeRangeMs
    );

    // Calculate analytics
    const uniqueUsers = [...new Set(filteredMessages.map(msg => msg.username))];
    const totalMessageLength = filteredMessages.reduce((sum, msg) => sum + msg.message.length, 0);
    const emotes = filteredMessages.flatMap(msg => msg.emotes);
    
    // Word frequency analysis
    const words = filteredMessages
      .flatMap(msg => msg.message.toLowerCase().split(/\s+/))
      .filter(word => word.length > 3 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word));
    
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularWords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    // Emote frequency
    const emoteCount = emotes.reduce((acc, emote) => {
      acc[emote] = (acc[emote] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularEmotes = Object.entries(emoteCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([emote, count]) => ({ emote, count }));

    // Hourly activity
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
      const count = filteredMessages.filter(msg => {
        const msgHour = new Date(msg.timestamp).getHours();
        return msgHour === hour;
      }).length;
      return { hour, count };
    });

    // Top chatters
    const userMessageCounts = filteredMessages.reduce((acc, msg) => {
      if (!acc[msg.username]) {
        acc[msg.username] = { count: 0, badges: msg.badges, displayName: msg.displayName };
      }
      acc[msg.username].count++;
      return acc;
    }, {} as Record<string, { count: number; badges: string[]; displayName: string }>);

    const topChatters = Object.entries(userMessageCounts)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10)
      .map(([username, data]) => ({
        username: data.displayName || username,
        messageCount: data.count,
        badges: data.badges
      }));

    const updatedAnalytics: ChatAnalytics = {
      messageCount: filteredMessages.length,
      uniqueUsers,
      emoteCount: emotes.length,
      averageMessageLength: totalMessageLength / Math.max(filteredMessages.length, 1),
      messageRate: filteredMessages.length / (timeRangeMs / (60 * 1000)), // messages per minute
      popularEmotes,
      popularWords,
      userActivity: uniqueUsers.map(username => {
        const userMessages = filteredMessages.filter(msg => msg.username === username);
        return {
          username,
          messageCount: userMessages.length,
          lastSeen: Math.max(...userMessages.map(msg => msg.timestamp))
        };
      }),
      hourlyActivity,
      chatMood: 'neutral', // TODO: Implement sentiment analysis
      topChatters
    };

    return NextResponse.json({
      success: true,
      channel,
      timeRange,
      analytics: updatedAnalytics
    });

  } catch (error) {
    console.error('Chat analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { channel, message, type } = body;

    if (type === 'message') {
      // Store incoming chat message
      const chatMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: message.username,
        displayName: message.displayName || message.username,
        message: message.text,
        timestamp: Date.now(),
        badges: message.badges || [],
        emotes: message.emotes || [],
        color: message.color || '#ffffff',
        isMod: message.badges?.includes('moderator') || false,
        isVip: message.badges?.includes('vip') || false,
        isSubscriber: message.badges?.includes('subscriber') || false
      };

      if (!chatData.has(channel)) {
        chatData.set(channel, []);
      }
      
      const messages = chatData.get(channel)!;
      messages.push(chatMessage);
      
      // Keep only last 1000 messages per channel
      if (messages.length > 1000) {
        messages.splice(0, messages.length - 1000);
      }
      
      chatData.set(channel, messages);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Chat message processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');
    
    if (channel) {
      chatData.delete(channel);
      analytics.delete(channel);
    } else {
      // Clear all data
      chatData.clear();
      analytics.clear();
    }

    return NextResponse.json({ success: true, message: 'Chat data cleared' });

  } catch (error) {
    console.error('Clear chat data error:', error);
    return NextResponse.json(
      { error: 'Failed to clear chat data' },
      { status: 500 }
    );
  }
}
