import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Fetch highlights from multiple channels
    const channels = ['buckfoozle', 'popout'];
    const allHighlights: unknown[] = [];
    
    for (const channel of channels) {
      try {
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host;
        const response = await fetch(`${protocol}://${host}/api/highlights/${channel}`);
        
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
    
    // Remove duplicates and sort, filter out messages older than 1 minute
    const oneMinuteAgo = Date.now() - (60 * 1000); // 1 minute ago
    const uniqueHighlights = allHighlights
      .filter((highlight, index, arr) => {
        const h = highlight as { id: string };
        return index === arr.findIndex((item: unknown) => {
          const i = item as { id: string };
          return i.id === h.id;
        });
      })
      .filter((highlight) => {
        const h = highlight as { timestamp: number };
        return h.timestamp && h.timestamp > oneMinuteAgo;
      })
      .sort((a, b) => {
        const aItem = a as { timestamp: number };
        const bItem = b as { timestamp: number };
        return bItem.timestamp - aItem.timestamp;
      });

    // Generate highlights HTML
    const highlightHtml = uniqueHighlights.map(highlight => {
      const msg = highlight as { 
        badges?: unknown[]; 
        messageHtml?: string; 
        message?: string;
        color?: string;
        displayName?: string;
        timestamp?: number;
      };
      const badgeInfos = (msg.badges || [])
        .filter((badge: unknown) => badge && typeof badge === 'object' && badge !== null && 'imageUrl' in badge)
        .slice(0, 4);
      
      const badgesHtml = badgeInfos.map((badge: unknown) => {
        const b = badge as { imageUrl: string; alt?: string; label?: string };
        return `<img src="${b.imageUrl}" alt="${b.alt || b.label}" class="badge" />`;
      }).join('');
      
      const messageContent = msg.messageHtml || msg.message || '';
      
      return `
        <div class="message">
          <div class="message-content">
            <div class="message-header">
              <div class="badges">
                ${badgesHtml}
              </div>
              <span class="username" style="color: ${msg.color || '#ffffff'}">${msg.displayName}</span>
            </div>
            <div class="message-text">${messageContent}</div>
            <div class="highlight-bar"></div>
          </div>
        </div>
      `;
    }).join('');

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ html: highlightHtml });
    
  } catch (error) {
    console.error('Error generating overlay data:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ html: '' });
  }
}
