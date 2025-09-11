"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface HighlightedMessage {
  id: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: number;
  color: string;
  badges: string[];
  source?: string;
}

function ChatOverlayContent() {
  const searchParams = useSearchParams();
  const [highlightedMessages, setHighlightedMessages] = useState<HighlightedMessage[]>([]);
  const [channel, setChannel] = useState<string>('general');
  const [settings] = useState({
    maxMessages: 10,
    displayDuration: 30000, // 30 seconds
    animationSpeed: 'normal' as 'slow' | 'normal' | 'fast'
  });

  // Get channel from URL params or use default
  useEffect(() => {
    const channelParam = searchParams?.get('channel') || 'general';
    setChannel(channelParam.toLowerCase());
  }, [searchParams]);

  // Fetch highlighted messages for the specified channel
  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const response = await fetch(`/api/highlights/${channel}`);
        if (response.ok) {
          const highlights = await response.json();
          setHighlightedMessages(highlights.slice(0, settings.maxMessages));
        } else {
          console.warn('Failed to fetch highlights:', response.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch highlights:', error);
      }
    };

    fetchHighlights();
    
    // Poll for updates every 2 seconds
    const interval = setInterval(fetchHighlights, 2000);
    return () => clearInterval(interval);
  }, [channel, settings.maxMessages]);

  // Auto-remove old messages
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setHighlightedMessages(prev => 
        prev.filter(msg => now - msg.timestamp < settings.displayDuration)
      );
    }, 5000);

    return () => clearInterval(cleanup);
  }, [settings.displayDuration]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
      'turbo': '⚡',
      'founder': '🏆',
      'subscriber-founder': '🏆⭐'
    };
    return badgeMap[badge] || '🎪';
  };

  const getAnimationClass = () => {
    const speeds = {
      slow: 'duration-1000',
      normal: 'duration-700', 
      fast: 'duration-300'
    };
    return speeds[settings.animationSpeed];
  };

  if (highlightedMessages.length === 0) {
    return (
      <div className="w-full h-screen bg-transparent flex items-center justify-center">
        <div className="text-white/20 text-lg font-medium">
          No highlighted messages for {channel}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-transparent flex flex-col overflow-hidden">
      {/* Channel indicator (optional, can be hidden) */}
      <div className="fixed top-4 left-4 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1 text-white/60 text-sm z-50">
        📺 {channel}
      </div>

      {/* Messages container with proper spacing from edges */}
      <div className="flex-1 flex flex-col justify-end p-6 pb-8 max-h-screen overflow-hidden">
        <div className="space-y-4 max-h-full overflow-y-auto">
          {highlightedMessages.map((msg, index) => (
          <div
            key={`${msg.id}-${msg.timestamp}`}
            className={`animate-slide-in-right bg-gradient-to-r from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-lg rounded-xl border-2 border-yellow-400/80 shadow-2xl transition-all ${getAnimationClass()}`}
            style={{
              animationDelay: `${index * 150}ms`,
              boxShadow: '0 0 30px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="p-6 relative overflow-hidden">
              {/* Highlight glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-orange-400/10 to-red-400/10 animate-pulse"></div>
              
              {/* Source indicator */}
              {msg.source && (
                <div className="absolute top-2 right-2 text-xs bg-black/40 px-2 py-1 rounded text-white/60">
                  {msg.source === 'extension' ? '🔌' : '🌐'}
                </div>
              )}
              
              {/* Header */}
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center space-x-2">
                  {/* Badges */}
                  {msg.badges.map((badge, badgeIndex) => (
                    <span key={`${badge}-${badgeIndex}`} className="text-sm" title={badge}>
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
      </div>

      {/* Settings overlay (hidden by default, can be shown with ?settings=true) */}
      {searchParams?.get('settings') === 'true' && (
        <div className="fixed top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white text-sm">
          <h3 className="font-bold mb-2">Overlay Settings</h3>
          <div className="space-y-2">
            <div>Channel: {channel}</div>
            <div>Max Messages: {settings.maxMessages}</div>
            <div>Display Duration: {settings.displayDuration/1000}s</div>
            <div>Animation: {settings.animationSpeed}</div>
          </div>
        </div>
      )}

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

export default function EnhancedChatOverlay() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen bg-transparent flex items-center justify-center">
        <div className="text-white/20 text-lg font-medium">Loading...</div>
      </div>
    }>
      <ChatOverlayContent />
    </Suspense>
  );
}
