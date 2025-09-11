"use client";

import { useEffect, useState } from 'react';

interface BadgeInfo {
  label: string;
  imageUrl: string;
  alt: string;
  color?: string;
}

interface EmoteInfo {
  name: string;
  imageUrl: string;
  positions: number[][];
}

interface HighlightedMessage {
  id: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: number;
  color: string;
  badges: BadgeInfo[];
  emotes: EmoteInfo[];
  messageHtml?: string; // HTML version with emotes
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
    <div className="w-full h-screen bg-transparent p-0 overflow-hidden">
      <div className="space-y-2">
        {highlightedMessages.map((msg) => {
          const badgeInfos = msg.badges
            .filter((badge): badge is BadgeInfo => {
              return badge !== null && badge !== undefined && 
                (typeof badge === 'object' ? Boolean(badge.label) : Boolean(badge));
            })
            .map(badge => badge)
            .filter(info => info.imageUrl || info.label);
            
          return (
            <div key={msg.id}>
              <div className="px-3 py-2">
                {/* Header */}
                <div className="flex items-center space-x-2 mb-1">
                  {/* Badges */}
                  {badgeInfos.length > 0 && (
                    <div className="flex items-center space-x-1">
                      {badgeInfos.slice(0, 4).map((badgeInfo, badgeIndex) => (
                        <div
                          key={badgeIndex}
                          className="inline-flex items-center justify-center"
                          title={badgeInfo.alt || badgeInfo.label}
                        >
                          {badgeInfo.imageUrl ? (
                            <img 
                              src={badgeInfo.imageUrl} 
                              alt={badgeInfo.alt || badgeInfo.label}
                              className="w-4 h-4"
                              style={{ 
                                border: 'none',
                                borderRadius: '2px',
                                display: 'block'
                              }}
                            />
                          ) : (
                            <span className="text-xs text-white bg-transparent">
                              {badgeInfo.label}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Username */}
                  <span 
                    className="font-bold text-sm"
                    style={{ 
                      color: msg.color || '#ffffff'
                    }}
                  >
                    {msg.displayName}:
                  </span>
                  
                  {/* Message with emotes */}
                  <span className="text-white text-sm">
                    {msg.messageHtml ? (
                      <span dangerouslySetInnerHTML={{ __html: msg.messageHtml }} />
                    ) : (
                      msg.message
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        /* Hide scrollbars */
        ::-webkit-scrollbar {
          display: none;
        }
        
        body {
          scrollbar-width: none;
        }
        
        /* Emote styling */
        .emote-image {
          height: 1.4em;
          width: auto;
          vertical-align: middle;
          max-width: none;
          display: inline;
        }
        
        /* Fix Twitch emote containers to display inline */
        .chat-line__message--emote-button {
          display: inline !important;
        }
        
        .chat-line__message--emote-button * {
          display: inline !important;
          vertical-align: middle;
        }
        
        .InjectLayout-sc-1i43xsx-0,
        .dvtAVE,
        .Layout-sc-1xcs6mc-0,
        .gJnMyS,
        .chat-image__container {
          display: inline !important;
          vertical-align: middle;
        }
        
        /* Ensure text fragments stay inline */
        .text-fragment {
          display: inline;
        }
        
        /* Force ALL elements with emote classes to be inline */
        span[dangerouslySetInnerHTML] img,
        span[dangerouslySetInnerHTML] * {
          display: inline !important;
          vertical-align: middle !important;
        }
        
        /* Additional fallback for any block-level elements in messages */
        .text-white div,
        .text-white span[dangerouslySetInnerHTML] div {
          display: inline !important;
        }
      `}</style>
    </div>
  );
}
