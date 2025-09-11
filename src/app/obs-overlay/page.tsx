"use client";

import { useEffect, useState } from 'react';

interface BadgeInfo {
  label: string;
  imageUrl: string;
  alt: string;
  color?: string;
}

interface HighlightedMessage {
  id: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: number;
  color: string;
  badges: BadgeInfo[];
  messageHtml?: string; // HTML version with emotes
}

export default function OBSOverlay() {
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
    return null; // Nothing to show
  }

  return (
    <html lang="en">
      <head>
        <title>OBS Chat Overlay</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          html, body {
            background: transparent !important;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          }
          
          .overlay-container {
            background: transparent;
            padding: 10px;
            width: 100vw;
            height: 100vh;
          }
          
          .message {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
            flex-wrap: wrap;
          }
          
          .badge {
            width: 16px;
            height: 16px;
            margin-right: 4px;
            border: none;
            border-radius: 2px;
          }
          
          .username {
            font-weight: bold;
            font-size: 14px;
            margin-right: 4px;
          }
          
          .message-text {
            font-size: 14px;
            color: white;
          }
          
          .emote-image {
            height: 1.4em;
            width: auto;
            vertical-align: middle;
            margin: 0 1px;
            display: inline;
            max-width: none;
          }
          
          /* Fix Twitch emote containers */
          .chat-line__message--emote-button,
          .InjectLayout-sc-1i43xsx-0,
          .dvtAVE,
          .Layout-sc-1xcs6mc-0,
          .gJnMyS,
          .chat-image__container {
            display: inline !important;
            vertical-align: middle;
          }
          
          .text-fragment {
            display: inline;
          }
          
          .message-text div,
          .message-text span[dangerouslySetInnerHTML] div {
            display: inline !important;
          }
        `}</style>
      </head>
      <body>
        <div className="overlay-container">
          {highlightedMessages.map((msg) => {
            const badgeInfos = msg.badges
              .filter((badge): badge is BadgeInfo => {
                return badge !== null && badge !== undefined && 
                  (typeof badge === 'object' ? Boolean(badge.label) : Boolean(badge));
              })
              .map(badge => badge)
              .filter(info => info.imageUrl || info.label);
              
            return (
              <div key={msg.id} className="message">
                {/* Badges */}
                {badgeInfos.length > 0 && badgeInfos.slice(0, 4).map((badgeInfo, badgeIndex) => (
                  badgeInfo.imageUrl ? (
                    <img
                      key={badgeIndex}
                      src={badgeInfo.imageUrl}
                      alt={badgeInfo.alt || badgeInfo.label}
                      className="badge"
                    />
                  ) : null
                ))}
                
                {/* Username */}
                <span 
                  className="username"
                  style={{ color: msg.color || '#ffffff' }}
                >
                  {msg.displayName}:
                </span>
                
                {/* Message with emotes */}
                <span className="message-text">
                  {msg.messageHtml ? (
                    <span dangerouslySetInnerHTML={{ __html: msg.messageHtml }} />
                  ) : (
                    msg.message
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </body>
    </html>
  );
}
