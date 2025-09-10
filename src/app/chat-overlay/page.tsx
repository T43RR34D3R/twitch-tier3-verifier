"use client";

import { useEffect, useState } from 'react';

interface HighlightedMessage {
  id: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: number;
  color: string;
  badges: string[];
}

export default function ChatOverlay() {
  const [highlightedMessages, setHighlightedMessages] = useState<HighlightedMessage[]>([]);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        // Fetch highlights from multiple possible channels
        const channels = ['buckfoozle', 'popout'];
        const allHighlights: HighlightedMessage[] = [];
        
        for (const channel of channels) {
          try {
            const response = await fetch(`/api/highlights/${channel}`);
            if (response.ok) {
              const data = await response.json();
              if (Array.isArray(data)) {
                allHighlights.push(...data);
              }
            }
          } catch (channelError) {
            console.warn(`Failed to fetch highlights for channel ${channel}:`, channelError);
          }
        }
        
        // Remove duplicates based on message ID and sort by timestamp (newest first)
        const uniqueHighlights = allHighlights
          .filter((highlight, index, arr) => 
            index === arr.findIndex(h => h.id === highlight.id)
          )
          .sort((a, b) => b.timestamp - a.timestamp);
          
        setHighlightedMessages(uniqueHighlights);
      } catch (error) {
        console.error('Failed to fetch highlights:', error);
      }
    };

    // Initial fetch
    fetchHighlights();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchHighlights, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };


  if (highlightedMessages.length === 0) {
    return (
      <div className="w-full h-screen bg-transparent flex items-center justify-center">
        <div className="text-white/20 text-lg">
          No highlighted messages
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-transparent p-4 overflow-hidden">
      <div className="space-y-3">
        {highlightedMessages.map((msg, index) => (
          <div
            key={msg.id}
            className="animate-fade-in bg-black/95 border border-gray-800 shadow-xl"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="px-4 py-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {/* Username */}
                  <span 
                    className="font-bold text-sm uppercase tracking-wide"
                    style={{ color: msg.color || '#ffffff' }}
                  >
                    {msg.displayName}
                  </span>
                </div>
                
                {/* Timestamp */}
                <div className="text-gray-400 text-xs font-mono uppercase tracking-wider">
                  {formatTime(msg.timestamp)}
                </div>
              </div>

              {/* Message */}
              <div className="text-white text-sm font-medium">
                {msg.message}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 4px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
