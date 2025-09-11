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
  );
}
