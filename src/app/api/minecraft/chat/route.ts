import { NextRequest } from 'next/server';

// This will store active WebSocket connections
const clients = new Set<WebSocket>();

interface ChatMessage {
  id: string;
  playerName: string;
  playerUuid: string;
  message: string;
  timestamp: number;
  playerSkinUrl: string;
}

export async function GET(request: NextRequest) {
  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get('upgrade');
  
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket connection', { status: 426 });
  }

  // In a production environment, you'd use a proper WebSocket server
  // For now, we'll create a basic response that explains the setup needed
  return new Response(
    JSON.stringify({
      message: 'WebSocket endpoint ready',
      instructions: 'This endpoint needs a WebSocket server setup. Use ws or socket.io for production.'
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate the incoming message
    if (!data.playerName || !data.playerUuid || !data.message) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Generate skin URL from UUID
    const skinUrl = `https://crafatar.com/avatars/${data.playerUuid}?size=32&overlay`;
    
    const chatMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerName: data.playerName,
      playerUuid: data.playerUuid,
      message: data.message,
      timestamp: Date.now(),
      playerSkinUrl: skinUrl,
    };

    // Broadcast to all connected WebSocket clients
    // Note: In production, you'd implement this with a proper WebSocket server
    console.log('New chat message:', chatMessage);
    
    // For now, we'll store the message and return success
    // In production, broadcast this via WebSocket to all connected clients
    
    return new Response(JSON.stringify({ success: true, message: chatMessage }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
