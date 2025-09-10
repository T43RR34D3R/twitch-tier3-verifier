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
        const response = await fetch('/api/twitch/chat?type=highlights');
        const data = await response.json();
        if (data.highlights) {
          setHighlightedMessages(data.highlights);
        }
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

  const getBadgeIcon = (badge: string) => {
    const badgeMap: Record<string, string> = {
      'broadcaster': '📺',
      'moderator': '⚔️',
      'vip': '💎',
      'subscriber': '⭐',
      'premium': '👑',
      'staff': '🛡️',
      'admin': '🔧',
      'global_mod': '🌍',
      'partner': '✅',
      'turbo': '⚡'
    };
    return badgeMap[badge] || '🎪';
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
      <div className="space-y-4">
        {highlightedMessages.map((msg, index) => (
          <div
            key={msg.id}
            className="animate-slide-in-right bg-gradient-to-r from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-lg rounded-xl border-2 border-yellow-400/80 shadow-2xl"
            style={{
              animationDelay: `${index * 100}ms`,
              boxShadow: '0 0 30px rgba(255, 215, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="p-6 relative overflow-hidden">
              {/* Highlight glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-orange-400/10 to-red-400/10 animate-pulse"></div>
              
              {/* Header */}
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center space-x-2">
                  {/* Badges */}
                  {msg.badges.map((badge) => (
                    <span key={badge} className="text-sm" title={badge}>
                      {getBadgeIcon(badge)}
                    </span>
                  ))}
                  
                  {/* Username */}
                  <span 
                    className="font-bold text-lg"
                    style={{ color: msg.color || '#ffffff' }}
                  >
                    {msg.displayName}
                  </span>
                </div>
                
                {/* Timestamp */}
                <div className="text-gray-300 text-sm bg-black/20 px-2 py-1 rounded">
                  {formatTime(msg.timestamp)}
                </div>
              </div>

              {/* Message */}
              <div className="relative z-10">
                <div className="text-white text-xl leading-relaxed font-medium break-words">
                  {msg.message}
                </div>
              </div>

              {/* Animated border */}
              <div className="absolute inset-0 rounded-xl border-2 border-yellow-400/60 animate-border-glow"></div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        
        @keyframes border-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.3);
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .animate-border-glow {
          animation: border-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
