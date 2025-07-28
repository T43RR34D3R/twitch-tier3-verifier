"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface ChatMessage {
  id: string;
  playerName: string;
  playerUuid: string;
  message: string;
  timestamp: number;
  playerSkinUrl: string;
}

export default function MinecraftChatOverlay() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Server-Sent Events connection for real-time chat
    const eventSource = new EventSource('/api/minecraft/chat-stream');
    
    eventSource.onopen = () => {
      console.log('Connected to Minecraft chat');
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'connected') {
        console.log('Connected with client ID:', data.clientId);
      } else if (data.type === 'message') {
        const message: ChatMessage = {
          id: data.id,
          playerName: data.playerName,
          playerUuid: data.playerUuid,
          message: data.message,
          timestamp: data.timestamp,
          playerSkinUrl: data.playerSkinUrl
        };
        
        setMessages(prev => {
          const newMessages = [message, ...prev];
          // Keep only last 10 messages for performance
          return newMessages.slice(0, 10);
        });
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-transparent p-4">
      {/* Connection status indicator */}
      <div className={`fixed top-4 right-4 w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
      
      {/* Chat messages */}
      <div className="space-y-3">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className="flex items-start space-x-3 bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-gray-600/50 animate-fade-in"
          >
            {/* Player head */}
            <div className="flex-shrink-0">
              <Image
                src={msg.playerSkinUrl}
                alt={`${msg.playerName}'s head`}
                width={32}
                height={32}
                className="rounded-md pixelated"
                unoptimized
              />
            </div>
            
            {/* Message content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline space-x-2">
                <span className="font-bold text-white text-sm">
                  {msg.playerName}
                </span>
                <span className="text-gray-400 text-xs">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-white text-sm mt-1 break-words">
                {msg.message}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {messages.length === 0 && (
        <div className="text-center text-gray-400 mt-8">
          <p>Waiting for chat messages...</p>
          <p className="text-sm mt-2">Status: {connected ? 'Connected' : 'Disconnected'}</p>
        </div>
      )}
    </div>
  );
}
