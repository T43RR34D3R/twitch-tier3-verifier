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

// Comprehensive badge mapping based on streamdatabase and Twitch data
const getBadgeInfo = (badge: string) => {
  // Clean up badge text
  const cleanBadge = badge.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim();
  
  // Global badges mapping
  const globalBadges: Record<string, { icon: string, color: string, label: string }> = {
    'staff': { icon: '🛡️', color: '#fa4454', label: 'Staff' },
    'admin': { icon: '🔧', color: '#fa4454', label: 'Admin' },
    'global_mod': { icon: '🌍', color: '#00ad03', label: 'Global Mod' },
    'moderator': { icon: '⚔️', color: '#00ff88', label: 'Moderator' },
    'broadcaster': { icon: '📺', color: '#ff6b6b', label: 'Broadcaster' },
    'vip': { icon: '💎', color: '#ff69b4', label: 'VIP' },
    'partner': { icon: '✅', color: '#9147ff', label: 'Partner' },
    'turbo': { icon: '⚡', color: '#6441a4', label: 'Turbo' },
    'premium': { icon: '👑', color: '#ffd700', label: 'Prime' },
    'founder': { icon: '🏆', color: '#ff6b35', label: 'Founder' },
    'artist-badge': { icon: '🎨', color: '#9146ff', label: 'Artist' },
    'game-developer': { icon: '🎮', color: '#ff6b35', label: 'Game Dev' }
  };
  
  // Channel-specific badges (subscriber badges)
  if (cleanBadge.includes('subscriber') || cleanBadge.includes('month') || cleanBadge.includes('year')) {
    // Parse subscriber length
    let subLength = 'Sub';
    if (cleanBadge.includes('2-month')) subLength = '2mo';
    else if (cleanBadge.includes('3-month')) subLength = '3mo';
    else if (cleanBadge.includes('6-month')) subLength = '6mo';
    else if (cleanBadge.includes('9-month')) subLength = '9mo';
    else if (cleanBadge.includes('1-year')) subLength = '1yr';
    else if (cleanBadge.includes('1.5-year')) subLength = '1.5yr';
    else if (cleanBadge.includes('2-year')) subLength = '2yr';
    else if (cleanBadge.includes('2.5-year')) subLength = '2.5yr';
    else if (cleanBadge.includes('3-year')) subLength = '3yr';
    
    return { icon: '⭐', color: '#9147ff', label: subLength };
  }
  
  // Bits badges
  if (cleanBadge.includes('cheer') || cleanBadge.includes('bits')) {
    const bitsAmount = cleanBadge.match(/\d+/);
    const amount = bitsAmount ? parseInt(bitsAmount[0]) : 0;
    
    let color = '#9146ff';
    if (amount >= 1000000) color = '#ffd700';
    else if (amount >= 100000) color = '#ff6b35';
    else if (amount >= 10000) color = '#ff4757';
    else if (amount >= 1000) color = '#5f27cd';
    
    return { icon: '💎', color, label: `${amount >= 1000 ? Math.floor(amount/1000) + 'K' : amount}` };
  }
  
  // Check global badges
  const globalMatch = Object.entries(globalBadges).find(([key]) => 
    cleanBadge.includes(key) || key.includes(cleanBadge)
  );
  
  if (globalMatch) {
    return globalMatch[1];
  }
  
  // Default fallback
  return { icon: '', color: '#64748b', label: cleanBadge || 'Badge' };
};

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
      <div className="space-y-4">
        {highlightedMessages.map((msg, index) => {
          const badgeInfos = msg.badges
            .filter(badge => badge && badge.trim())
            .map(badge => getBadgeInfo(badge))
            .filter(info => info.icon || info.label);
            
          return (
            <div
              key={msg.id}
              className="animate-fade-in group relative"
              style={{ animationDelay: `${index * 100}ms` }}
            >
            {/* Outer glow container */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-lg blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Main content */}
            <div className="relative bg-black/95 border border-gray-700/50 rounded-lg backdrop-blur-sm shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-500">
              {/* Inner subtle glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-lg"></div>
              
              <div className="relative px-5 py-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {/* Badges */}
                    {badgeInfos.length > 0 && (
                      <div className="flex items-center space-x-1.5">
                        {badgeInfos.slice(0, 4).map((badgeInfo, badgeIndex) => (
                          <div
                            key={badgeIndex}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold border backdrop-blur-sm shadow-md"
                            style={{ 
                              backgroundColor: `${badgeInfo.color}25`,
                              borderColor: `${badgeInfo.color}60`,
                              color: badgeInfo.color,
                              boxShadow: `0 0 8px ${badgeInfo.color}30`
                            }}
                            title={badgeInfo.label}
                          >
                            {badgeInfo.icon && <span className="mr-1 text-xs">{badgeInfo.icon}</span>}
                            <span className="truncate max-w-14 text-xs">{badgeInfo.label}</span>
                          </div>
                        ))}
                        {badgeInfos.length > 4 && (
                          <div className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-gray-800/50 text-gray-300 border border-gray-600/50">
                            +{badgeInfos.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Username with text glow */}
                    <span 
                      className="font-bold text-base uppercase tracking-wide drop-shadow-lg"
                      style={{ 
                        color: msg.color || '#ffffff',
                        textShadow: `0 0 10px ${msg.color || '#ffffff'}40, 0 0 20px ${msg.color || '#ffffff'}20`
                      }}
                    >
                      {msg.displayName}
                    </span>
                  </div>
                  
                  {/* Timestamp with subtle glow */}
                  <div className="text-gray-300 text-xs font-mono uppercase tracking-wider bg-gray-900/50 px-2 py-1 rounded border border-gray-700/50 shadow-lg">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>

                {/* Message with soft shadow */}
                <div className="text-white text-sm font-medium leading-relaxed drop-shadow-md">
                  {msg.message}
                </div>
              </div>
              
              {/* Bottom highlight bar with animated glow */}
              <div className="h-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-b-lg shadow-lg animate-pulse-glow"></div>
            </div>
          </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.8;
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.5), 0 0 30px rgba(168, 85, 247, 0.3), 0 0 45px rgba(236, 72, 153, 0.2);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.7), 0 0 40px rgba(168, 85, 247, 0.5), 0 0 60px rgba(236, 72, 153, 0.3);
          }
        }
        
        @keyframes floating {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        
        .group:hover .animate-floating {
          animation: floating 2s ease-in-out infinite;
        }
        
        /* Enhanced shadows and glows */
        .shadow-glow {
          box-shadow: 
            0 4px 15px -3px rgba(0, 0, 0, 0.5),
            0 2px 6px -2px rgba(0, 0, 0, 0.3),
            0 0 25px rgba(59, 130, 246, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        .text-glow {
          text-shadow: 
            0 0 10px currentColor,
            0 0 20px currentColor,
            0 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        /* Custom scrollbar with glow */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3b82f6, #8b5cf6, #ec4899);
          border-radius: 3px;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #2563eb, #7c3aed, #db2777);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.7);
        }
        
        /* Backdrop blur enhancement */
        .backdrop-blur-enhanced {
          backdrop-filter: blur(12px) saturate(180%);
        }
      `}</style>
    </div>
  );
}
