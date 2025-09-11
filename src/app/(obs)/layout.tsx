export default function OBSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>OBS Chat Overlay</title>
        <style dangerouslySetInnerHTML={{
          __html: `
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
            
            #__next {
              background: transparent !important;
              width: 100%;
              height: 100%;
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
            
            /* Hide scrollbars */
            ::-webkit-scrollbar {
              display: none;
            }
            
            body {
              scrollbar-width: none;
            }
          `
        }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
