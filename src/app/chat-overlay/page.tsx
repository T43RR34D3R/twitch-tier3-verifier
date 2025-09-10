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

  const getBadgeInfo = (badge: string) => {
    // Clean up badge text and map to display info
    const cleanBadge = badge.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim();
    
    const badgeMap: Record<string, { icon: string, color: string, label: string }> = {
      'broadcaster': { icon: '📺', color: '#ff6b6b', label: 'Broadcaster' },
      'moderator': { icon: '⚔️', color: '#00ff88', label: 'Moderator' },
      'vip': { icon: '💎', color: '#ff69b4', label: 'VIP' },
      'subscriber': { icon: '⭐', color: '#9147ff', label: 'Subscriber' },
      'premium': { icon: '👑', color: '#ffd700', label: 'Premium' },
      'staff': { icon: '🛡️', color: '#fa4454', label: 'Staff' },
      'admin': { icon: '🔧', color: '#fa4454', label: 'Admin' },
      'global_mod': { icon: '🌍', color: '#00ad03', label: 'Global Mod' },
      'partner': { icon: '✅', color: '#9147ff', label: 'Partner' },
      'turbo': { icon: '⚡', color: '#6441a4', label: 'Turbo' }
    };
    
    // Check for common badge patterns
    if (cleanBadge.includes('month') || cleanBadge.includes('subscriber')) {
      return { icon: '⭐', color: '#9147ff', label: cleanBadge };
    }
    if (cleanBadge.includes('moderator') || cleanBadge.includes('mod')) {
      return { icon: '⚔️', color: '#00ff88', label: 'Moderator' };
    }
    if (cleanBadge.includes('vip')) {
      return { icon: '💎', color: '#ff69b4', label: 'VIP' };
    }
    
    return badgeMap[cleanBadge] || { icon: '', color: '#64748b', label: cleanBadge };
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
    <div className="w-full h-screen bg-transparent p-6 overflow-hidden">
      <div className="space-y-4">
        {highlightedMessages.map((msg, index) => {
          const badgeInfos = msg.badges
            .filter(badge => badge && badge.trim())
            .map(badge => getBadgeInfo(badge))
            .filter(info => info.icon || info.label);
            
          return (
            <div
              key={msg.id}
              className="animate-fade-in bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {/* Username */}
                    <span 
                      className="font-semibold text-lg leading-tight"
                      style={{ color: msg.color || '#ffffff' }}
                    >
                      {msg.displayName}
                    </span>
                    
                    {/* Badges */}
                    <div className="flex items-center space-x-2">
                      {badgeInfos.slice(0, 3).map((badgeInfo, badgeIndex) => (
                        <div
                          key={badgeIndex}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                          style={{ 
                            backgroundColor: `${badgeInfo.color}20`,
                            borderColor: `${badgeInfo.color}40`,
                            color: badgeInfo.color
                          }}
                          title={badgeInfo.label}
                        >
                          {badgeInfo.icon && <span className="mr-1">{badgeInfo.icon}</span>}
                          <span className="truncate max-w-20">{badgeInfo.label}</span>
                        </div>
                      ))}
                      {badgeInfos.length > 3 && (
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50">
                          +{badgeInfos.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Timestamp */}
                  <div className="text-slate-400 text-sm font-mono bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>

                {/* Message */}
                <div className="bg-slate-800/40 rounded-md p-3 border-l-4 border-blue-500/60">
                  <div className="text-white text-base leading-relaxed break-words">
                    {msg.message}
                  </div>
                </div>
              </div>
              
              {/* Subtle highlight indicator */}
              <div className="h-1 bg-gradient-to-r from-blue-500/60 to-purple-500/60 rounded-b-lg"></div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        /* Smooth hover transitions */
        .transition-all {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Custom scrollbar for overflow */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(71, 85, 105, 0.1);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.7);
        }
      `}</style>
    </div>
  );
}
