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
    
    // Remove duplicates and sort
    const uniqueHighlights = allHighlights
      .filter((highlight, index, arr) => {
        const h = highlight as { id: string };
        return index === arr.findIndex((item: unknown) => {
          const i = item as { id: string };
          return i.id === h.id;
        });
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
          ${badgesHtml}
          <span class="username" style="color: ${msg.color || '#ffffff'}">${msg.displayName}:</span>
          <span class="message-text">${messageContent}</span>
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
    .message-text span div {
      display: inline !important;
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
    // Auto-refresh every 2 seconds
    setInterval(() => {
      window.location.reload();
    }, 2000);
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
