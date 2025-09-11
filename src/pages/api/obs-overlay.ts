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

    // Generate pure HTML
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

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>OBS Chat Overlay</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      background: transparent !important;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      width: 100vw;
      height: 100vh;
    }
    
    .overlay-container {
      background: transparent;
      padding: 40px;
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column-reverse;
      align-items: center;
      justify-content: flex-start;
      padding-top: 40vh;
      gap: 24px;
      transform: scale(1.2);
      transform-origin: center;
    }
    
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
    
    .message {
      animation: fade-in 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      position: relative;
      max-width: 1200px;
      width: auto;
      display: inline-block;
    }
    
    /* Outer glow container */
    .message::before {
      content: '';
      position: absolute;
      inset: -10px;
      background: linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2));
      border-radius: 12px;
      filter: blur(15px);
      opacity: 0.75;
      z-index: -2;
    }
    
    /* Main content */
    .message-content {
      background: rgba(0, 0, 0, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      position: relative;
      padding: 24px 32px;
      width: auto;
      display: block;
    }
    
    /* Inner subtle glow */
    .message-content::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), transparent, transparent);
      border-radius: 8px;
      pointer-events: none;
    }
    
    .message-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .badges {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .badge {
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 4px;
      display: block;
    }
    
    .username {
      font-weight: bold;
      font-size: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-shadow: 0 0 15px currentColor;
      filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5));
    }
    
    .message-text {
      font-size: 18px;
      color: white;
      font-weight: 500;
      line-height: 1.6;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    }
    
    .emote-image {
      height: 1.8em;
      width: auto;
      vertical-align: middle;
      margin: 0 2px;
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
    .message-text span div {
      display: inline !important;
    }
    
    /* Bottom highlight bar with animated glow */
    .highlight-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
      border-radius: 0 0 12px 12px;
      animation: pulse-glow 3s ease-in-out infinite;
    }
    
    /* Hide scrollbars */
    ::-webkit-scrollbar {
      display: none;
    }
    
    body {
      scrollbar-width: none;
    }
  </style>
</head>
<body>
  <div class="overlay-container">
    ${highlightHtml}
  </div>
  
  <script>
    // Auto-update content every 2 seconds without page refresh
    let isUpdating = false;
    let lastContentHash = '';
    
    // Simple hash function for content comparison
    function simpleHash(str) {
      let hash = 0;
      if (str.length === 0) return hash;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash;
    }
    
    async function updateContent() {
      if (isUpdating) return;
      isUpdating = true;
      
      try {
        const response = await fetch('/api/obs-overlay-data');
        const data = await response.json();
        
        // Create hash of new content
        const newContentHash = simpleHash(data.html || '');
        
        // Only update if content has actually changed
        if (newContentHash !== lastContentHash) {
          const container = document.querySelector('.overlay-container');
          if (container) {
            container.innerHTML = data.html || '';
            lastContentHash = newContentHash;
            console.log('Content updated');
          }
        }
      } catch (error) {
        console.error('Update failed:', error);
      } finally {
        isUpdating = false;
      }
    }
    
    // Calculate initial hash to prevent immediate update
    const initialContainer = document.querySelector('.overlay-container');
    if (initialContainer) {
      lastContentHash = simpleHash(initialContainer.innerHTML);
    }
    
    // Update every 2 seconds
    setInterval(updateContent, 2000);
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
    
  } catch (error) {
    console.error('Error generating OBS overlay:', error);
    
    const errorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>OBS Chat Overlay - Error</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: transparent !important; font-family: sans-serif; }
  </style>
</head>
<body>
  <div style="padding: 10px; color: white;">No highlights available</div>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(errorHtml);
  }
}
