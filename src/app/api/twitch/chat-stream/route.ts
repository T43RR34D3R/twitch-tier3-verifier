import { NextRequest } from 'next/server';
import tmi from 'tmi.js';

// Global IRC client instance
let client: tmi.Client | null = null;
const connectedChannels = new Set<string>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get('channel') || 'buckfoozle';
  
  // Create ReadableStream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      const sendEvent = (data: unknown) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Initialize IRC client if not exists
      if (!client) {
        client = new tmi.Client({
          options: { debug: false },
          identity: {
            username: process.env.TWITCH_BOT_USERNAME,
            password: process.env.TWITCH_BOT_TOKEN,
          },
          channels: []
        });

        client.on('connected', (addr, port) => {
          console.log(`Connected to Twitch IRC at ${addr}:${port}`);
        });

        client.on('message', (channel, tags, message, self) => {
          if (self) return; // Ignore messages from the bot itself
          
          const channelName = channel.replace('#', '');
          
          const chatMessage = {
            type: 'message',
            id: tags.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            username: tags.username || 'unknown',
            displayName: tags['display-name'] || tags.username || 'unknown',
            message: message,
            timestamp: Date.now(),
            color: tags.color || '#ffffff',
            badges: Object.keys(tags.badges || {}),
            isMod: tags.mod || false,
            isVip: tags.vip || false,
            isSubscriber: tags.subscriber || false,
            isBroadcaster: tags.username === channelName,
            channel: channelName,
            emotes: tags.emotes || {},
            userId: tags['user-id'] || ''
          };
          
          sendEvent(chatMessage);
        });

        client.on('timeout', (channel, username, reason, duration) => {
          sendEvent({
            type: 'moderation',
            action: 'timeout',
            channel: channel.replace('#', ''),
            username,
            reason,
            duration,
            timestamp: Date.now()
          });
        });

        client.on('ban', (channel, username, reason) => {
          sendEvent({
            type: 'moderation',
            action: 'ban',
            channel: channel.replace('#', ''),
            username,
            reason,
            timestamp: Date.now()
          });
        });

        client.on('messagedeleted', (channel, username, deletedMessage) => {
          sendEvent({
            type: 'moderation',
            action: 'delete',
            channel: channel.replace('#', ''),
            username,
            deletedMessage,
            timestamp: Date.now()
          });
        });

        client.on('roomstate', (channel, state) => {
          sendEvent({
            type: 'roomstate',
            channel: channel.replace('#', ''),
            state,
            timestamp: Date.now()
          });
        });

        client.on('clearchat', (channel) => {
          sendEvent({
            type: 'moderation',
            action: 'clear',
            channel: channel.replace('#', ''),
            timestamp: Date.now()
          });
        });

        client.connect().catch(console.error);
      }

      // Join the channel if not already connected
      if (!connectedChannels.has(channel)) {
        client.join(channel).then(() => {
          connectedChannels.add(channel);
          sendEvent({
            type: 'connected',
            channel,
            timestamp: Date.now()
          });
        }).catch((error) => {
          console.error(`Failed to join channel ${channel}:`, error);
          sendEvent({
            type: 'error',
            message: `Failed to join channel ${channel}`,
            error: error.message,
            timestamp: Date.now()
          });
        });
      } else {
        // Already connected
        sendEvent({
          type: 'connected',
          channel,
          timestamp: Date.now()
        });
      }

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        sendEvent({
          type: 'heartbeat',
          timestamp: Date.now()
        });
      }, 30000);

      // Cleanup function
      const cleanup = () => {
        clearInterval(heartbeat);
        if (connectedChannels.has(channel) && client) {
          client.part(channel);
          connectedChannels.delete(channel);
        }
      };

      // Handle client disconnect
      request.signal?.addEventListener('abort', cleanup);
      
      return cleanup;
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
