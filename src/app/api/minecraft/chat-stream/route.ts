import { NextRequest } from 'next/server';

// Simple in-memory store for chat messages
let chatMessages: any[] = [];
let clients: { id: string; controller: ReadableStreamDefaultController }[] = [];

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      const clientId = Math.random().toString(36).substr(2, 9);
      clients.push({ id: clientId, controller });
      
      // Send connection established message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`));
      
      // Send any existing messages
      chatMessages.forEach(msg => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'message', ...msg })}\n\n`));
      });
      
      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clients = clients.filter(client => client.id !== clientId);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
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
    
    const chatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerName: data.playerName,
      playerUuid: data.playerUuid,
      message: data.message,
      timestamp: Date.now(),
      playerSkinUrl: skinUrl,
    };

    // Store the message
    chatMessages.push(chatMessage);
    
    // Keep only last 50 messages
    if (chatMessages.length > 50) {
      chatMessages = chatMessages.slice(-50);
    }

    // Broadcast to all connected clients
    const encoder = new TextEncoder();
    const messageData = `data: ${JSON.stringify({ type: 'message', ...chatMessage })}\n\n`;
    
    clients.forEach(client => {
      try {
        client.controller.enqueue(encoder.encode(messageData));
      } catch (error) {
        console.error('Error sending to client:', error);
      }
    });
    
    return new Response(JSON.stringify({ success: true, message: chatMessage }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
