// Enhanced Twitch Chat Highlighter - Content Script
console.log('🎯 Enhanced Twitch Chat Highlighter loaded!');

// Inject CSS for extension styling
const style = document.createElement('style');
style.textContent = `
  .chat-highlighter-selected {
    background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2)) !important;
    border-left: 3px solid #3b82f6 !important;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.3) !important;
    animation: highlightPulse 2s ease-in-out !important;
  }
  
  @keyframes highlightPulse {
    0% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
    50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
    100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.3); }
  }
  
  .chat-highlighter-feedback {
    position: absolute;
    top: -30px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    z-index: 10000;
    animation: feedbackSlide 2s ease-out forwards;
    pointer-events: none;
  }
  
  .chat-highlighter-feedback--success {
    background: rgba(34, 197, 94, 0.9);
    border: 1px solid #22c55e;
  }
  
  .chat-highlighter-feedback--remove {
    background: rgba(239, 68, 68, 0.9);
    border: 1px solid #ef4444;
  }
  
  @keyframes feedbackSlide {
    0% { opacity: 0; transform: translateY(10px); }
    20% { opacity: 1; transform: translateY(0); }
    80% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-10px); }
  }
  
  .chat-highlighter-indicator {
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(20, 20, 30, 0.95);
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: bold;
    z-index: 10001;
    border: 1px solid rgba(59, 130, 246, 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    cursor: pointer;
  }
  
  .chat-highlighter-indicator:hover {
    background: rgba(30, 30, 50, 0.98);
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  }
  
  .chat-highlighter-indicator.minimized {
    padding: 6px 8px;
    border-radius: 50%;
    width: auto;
    height: auto;
  }
  
  .chat-highlighter-button {
    position: absolute;
    right: 32px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: #ffcc00;
    padding: 4px;
    font-size: 16px;
    font-weight: normal;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
    z-index: 10000;
    user-select: none;
    pointer-events: none;
    line-height: 1;
  }
  
  [data-a-target="chat-line-message"]:hover .chat-highlighter-button[data-highlighter-button="true"],
  .chat-line__message:hover .chat-highlighter-button[data-highlighter-button="true"],
  [data-test-selector="chat-line-message"]:hover .chat-highlighter-button[data-highlighter-button="true"],
  [class*="Layout-sc-"]:hover .chat-highlighter-button[data-highlighter-button="true"] {
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto !important;
  }
  
  .chat-highlighter-button:hover {
    color: #ffffff;
    text-shadow: 0 0 8px #ffcc00;
    transform: translateY(-50%) scale(1.1);
  }
  
  .chat-highlighter-button--highlighted {
    color: #ff4444;
  }
  
  .chat-highlighter-button--highlighted:hover {
    color: #ff0000;
    text-shadow: 0 0 8px #ff4444;
    transform: translateY(-50%) scale(1.1);
  }
  
  /* Hide conflicting Twitch buttons */
  [data-a-target="chat-line-message"] button[aria-label*="More"],
  [data-a-target="chat-line-message"] button[data-a-target*="more"],
  .chat-line__message button[aria-label*="More"],
  .chat-line__message button[data-a-target*="more"] {
    display: none !important;
  }
  
  .indicator-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .indicator-minimize {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 2px;
    font-size: 14px;
    font-weight: bold;
    transition: color 0.2s ease;
  }
  
  .indicator-minimize:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }
  
  .chat-highlighter-global-feedback {
    position: fixed;
    top: 60px;
    right: 10px;
    background: rgba(239, 68, 68, 0.95);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: bold;
    z-index: 10002;
    border: 1px solid #ef4444;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    max-width: 300px;
    display: none;
  }
  
  .chat-highlighter-global-feedback--error {
    background: rgba(239, 68, 68, 0.95);
    border-color: #ef4444;
  }
`;
document.head.appendChild(style);

class TwitchChatHighlighter {
  constructor() {
    this.isEnabled = true;
    this.highlightedMessages = new Set();
    this.emoteCache = new Map(); // Cache for emote data
    this.channelId = null;
    this.channelName = null;
    this.init();
  }

  async init() {
    // Get settings from extension storage
    await this.loadSettings();
    
    // Extract channel info and load emotes
    await this.loadChannelInfo();
    await this.loadEmotes();
    
    // Wait for chat to load
    this.waitForChat();
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'toggle_extension') {
        this.isEnabled = message.enabled;
        this.updateUI();
      }
      sendResponse({ success: true });
    });

    // Add visual indicator
    this.addIndicator();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['enabled']);
      this.isEnabled = result.enabled !== false; // Default to enabled
    } catch (error) {
      console.log('Using default settings');
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({
        enabled: this.isEnabled
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  waitForChat() {
    const checkForChat = () => {
      // Look for chat containers in various Twitch layouts
      const chatSelectors = [
        '[data-test-selector="chat-scrollable-area__message-container"]',
        '[role="log"]',
        '[data-a-target="chat-scroller"]',
        '.chat-scrollable-area__message-container',
        '.simplebar-content'
      ];

      let chatContainer = null;
      for (const selector of chatSelectors) {
        chatContainer = document.querySelector(selector);
        if (chatContainer) {
          console.log(`📺 Chat found with selector: ${selector}`);
          break;
        }
      }

      if (chatContainer) {
        console.log('📺 Chat found! Setting up click detection...');
        this.setupChatClickDetection(chatContainer);
      } else {
        // Try again in 1 second
        setTimeout(checkForChat, 1000);
      }
    };

    checkForChat();
  }

  setupChatClickDetection(chatContainer) {
    console.log('📺 Setting up hover button system for chat messages...');
    
    // Also setup observer for new messages to add buttons
    this.observeNewMessages(chatContainer);
    
    // Add buttons to existing messages
    this.addButtonsToExistingMessages(chatContainer);
  }
  
  addButtonsToExistingMessages(chatContainer) {
    // Find all existing chat messages and add buttons
    const existingMessages = chatContainer.querySelectorAll([
      '[data-a-target="chat-line-message"]',
      '.chat-line__message', 
      '[data-test-selector="chat-line-message"]',
      '[class*="Layout-sc-"]:has([data-a-target="chat-line-message-body"])'
    ].join(','));
    
    console.log('🎯 Found', existingMessages.length, 'existing messages to add buttons to');
    
    existingMessages.forEach(messageElement => {
      this.addHighlightButton(messageElement);
    });
  }
  
  addHighlightButton(messageElement) {
    // Skip if button already exists or element is invalid
    if (!messageElement || messageElement.querySelector('.chat-highlighter-button')) {
      return;
    }
    
    // Remove any existing highlight buttons to prevent duplicates
    const existingButtons = messageElement.querySelectorAll('.chat-highlighter-button');
    existingButtons.forEach(btn => btn.remove());
    
    // Hide any conflicting Twitch buttons that might be showing
    const twitchButtons = messageElement.querySelectorAll('button[aria-label*="More"], button[data-a-target*="more"]');
    twitchButtons.forEach(btn => {
      btn.style.display = 'none';
    });
    
    // Make sure the message element has relative positioning
    const computedStyle = window.getComputedStyle(messageElement);
    if (computedStyle.position === 'static') {
      messageElement.style.position = 'relative';
    }
    
    // Create the highlight button
    const button = document.createElement('button');
    button.className = 'chat-highlighter-button';
    button.innerHTML = '⭐';
    button.title = 'Highlight message';
    button.setAttribute('data-highlighter-button', 'true'); // Mark as our button
    
    // Check if message is already highlighted
    const messageData = this.extractMessageData(messageElement);
    if (messageData && this.highlightedMessages.has(messageData.id)) {
      button.classList.add('chat-highlighter-button--highlighted');
      button.innerHTML = '✖';
      button.title = 'Remove highlight';
    }
    
    // Add click handler
    button.addEventListener('click', (event) => {
      if (!this.isEnabled) return;
      
      event.preventDefault();
      event.stopPropagation();
      
      console.log('🎯 Highlight button clicked for message:', messageElement);
      this.handleMessageClick(messageElement);
      
      // Update button appearance
      const isHighlighted = button.classList.contains('chat-highlighter-button--highlighted');
      if (isHighlighted) {
        button.classList.remove('chat-highlighter-button--highlighted');
        button.innerHTML = '⭐';
        button.title = 'Highlight message';
      } else {
        button.classList.add('chat-highlighter-button--highlighted');
        button.innerHTML = '✖';
        button.title = 'Remove highlight';
      }
    });
    
    // Add button to message
    messageElement.appendChild(button);
  }

  handleMessageClick(messageElement) {
    try {
      const messageData = this.extractMessageData(messageElement);
      if (messageData) {
        const messageId = messageData.id;
        
        // Check if already highlighted by looking for visual indicator
        const isHighlighted = messageElement.classList.contains('chat-highlighter-selected') || 
                             this.highlightedMessages.has(messageId);
        
        if (isHighlighted) {
          this.unhighlightMessage(messageElement, messageId, messageData);
        } else {
          this.highlightMessage(messageElement, messageId, messageData);
        }
      }
    } catch (error) {
      console.error('Error handling message click:', error);
    }
  }

  extractMessageData(messageElement) {
    try {
      console.log('🔍 Extracting message data from element:', messageElement);
      
      // Extract username - updated selectors based on DOM inspection
      const usernameElement = messageElement.querySelector([
        '[data-a-target="chat-message-username"]',
        '[data-test-selector="message-username"]', 
        '.chat-author__display-name',
        '[data-a-target="chat-line-username"]',
        '.chat-line__username'
      ].join(','));
      
      console.log('👤 Username element found:', usernameElement);

      // Extract message text - updated selectors 
      const messageTextElement = messageElement.querySelector([
        '[data-a-target="chat-line-message-body"]',
        '[data-a-target="chat-message-text"]',
        '.text-fragment',
        '.chat-line__message-body'
      ].join(','));
      
      console.log('💬 Message text element found:', messageTextElement);

      // Extract badges with better detection
      const badgeElements = messageElement.querySelectorAll([
        '.chat-badge',
        '[data-a-target*="badge"]',
        '.chat-line__message--badges img',
        '[class*="ChatBadge"] img',
        '[class*="badge"] img'
      ].join(','));
      
      // Extract emotes from the message (same approach as badges)
      const emoteElements = messageTextElement.querySelectorAll([
        'img[data-a-target="emote"]',
        'img[alt]:not([data-a-target*="badge"]):not([class*="badge"])',
        '.chat-line__message--emote img',
        '[class*="emote"] img'
      ].join(','));
      
      const emotes = Array.from(emoteElements).map(emote => {
        const alt = emote.getAttribute('alt');
        const src = emote.getAttribute('src');
        const srcSet = emote.getAttribute('srcset');
        
        if (!src || !alt) return null;
        
        // Skip badges and invalid emotes
        if (alt.includes('badge') || src.includes('badge') || alt.length < 2 || alt.length > 25) {
          return null;
        }
        
        // Only include Twitch emote URLs
        if (!src.includes('static-cdn.jtvnw.net/emoticons') && !src.includes('emoticons.twitch.tv')) {
          return null;
        }
        
        // Extract different resolution URLs from srcset if available
        let imageUrl2x = src.replace('/1.0', '/2.0');
        let imageUrl4x = src.replace('/1.0', '/3.0');
        
        if (srcSet) {
          const srcSet2xMatch = srcSet.match(/(https:\/\/[^\s]+\/2\.0)\s+2x/);
          const srcSet4xMatch = srcSet.match(/(https:\/\/[^\s]+\/(3|4)\.0)\s+[34]x/);
          if (srcSet2xMatch) imageUrl2x = srcSet2xMatch[1];
          if (srcSet4xMatch) imageUrl4x = srcSet4xMatch[1];
        }
        
        // Extract emote ID from URL
        const idMatch = src.match(/\/emoticons\/v2\/(\d+)\//); 
        const emoteId = idMatch ? idMatch[1] : alt;
        
        return {
          name: alt,
          id: emoteId,
          imageUrl: src,
          imageUrl2x: imageUrl2x,
          imageUrl4x: imageUrl4x,
          alt: alt
        };
      }).filter(emote => emote !== null);
      
      console.log('🎭 Extracted', emotes.length, 'emotes from message DOM:', emotes.map(e => e.name));
      
      // Immediately add these emotes to cache for use in this message
      emotes.forEach(emote => {
        this.emoteCache.set(emote.name, {
          id: emote.id,
          name: emote.name,
          imageUrl: emote.imageUrl,
          imageUrl2x: emote.imageUrl2x,
          imageUrl4x: emote.imageUrl4x,
          type: 'message-extracted'
        });
        console.log('🎭 ✨ Added fresh emote to cache:', emote.name, '->', emote.imageUrl);
      });

      // Extract user color
      const colorElement = usernameElement || messageElement.querySelector('[style*="color"]');
      const userColor = colorElement ? 
        window.getComputedStyle(colorElement).color || '#ffffff' : '#ffffff';

      if (!usernameElement || !messageTextElement) {
        console.log('⚠️ Could not extract message data:');
        console.log('Username element:', usernameElement);
        console.log('Message text element:', messageTextElement);
        console.log('Full message element:', messageElement);
        console.log('Element HTML:', messageElement.outerHTML);
        return null;
      }

      const username = usernameElement.textContent?.trim() || '';
      let messageText = '';
      
      // Better message text extraction - get both text and emote alt text
      if (messageTextElement) {
        // Clone the element to work with
        const messageClone = messageTextElement.cloneNode(true);
        
        // Replace img elements with their alt text to get complete message
        const images = messageClone.querySelectorAll('img[alt]');
        images.forEach(img => {
          const altText = img.getAttribute('alt') || img.getAttribute('data-a-target') || 'emote';
          const textNode = document.createTextNode(altText);
          img.parentNode?.replaceChild(textNode, img);
        });
        
        messageText = messageClone.textContent?.trim() || '';
        console.log('📝 Enhanced message extraction. Original element:', messageTextElement);
        console.log('📝 Found images:', images.length);
        console.log('📝 Final extracted text:', messageText);
      }
      
    console.log('📝 Extracted username:', username);
    console.log('📝 Extracted message text:', messageText);
      
      if (!username || !messageText) {
        console.log('❌ Username or message text is empty');
        console.log('  - Username length:', username.length);
        console.log('  - Message text length:', messageText.length);
        console.log('  - Message element HTML:', messageTextElement?.outerHTML);
        return null;
      }
      
      // Enhanced badge extraction with image URLs
      const badges = Array.from(badgeElements).map(badge => {
        const alt = badge.getAttribute('alt');
        const title = badge.getAttribute('title');
        const src = badge.getAttribute('src');
        
        if (!src) return null;
        
        // Extract badge info and preserve image URL
        let badgeType = alt || title || 'badge';
        let badgeLabel = badgeType;
        
        // Parse badge type from image src for better labeling
        if (src.includes('subscriber')) {
          const monthMatch = src.match(/([0-9]+)/g);
          if (monthMatch) {
            const months = parseInt(monthMatch[monthMatch.length - 1]);
            if (months >= 36) badgeLabel = 'Subscriber 3-Year';
            else if (months >= 30) badgeLabel = 'Subscriber 2.5-Year';
            else if (months >= 24) badgeLabel = 'Subscriber 2-Year';
            else if (months >= 18) badgeLabel = 'Subscriber 1.5-Year';
            else if (months >= 12) badgeLabel = 'Subscriber 1-Year';
            else if (months >= 9) badgeLabel = 'Subscriber 9-Month';
            else if (months >= 6) badgeLabel = 'Subscriber 6-Month';
            else if (months >= 3) badgeLabel = 'Subscriber 3-Month';
            else if (months >= 2) badgeLabel = 'Subscriber 2-Month';
            else badgeLabel = 'Subscriber';
          }
        } else if (src.includes('moderator')) {
          badgeLabel = 'Moderator';
        } else if (src.includes('broadcaster')) {
          badgeLabel = 'Broadcaster';
        } else if (src.includes('vip')) {
          badgeLabel = 'VIP';
        } else if (src.includes('partner')) {
          badgeLabel = 'Partner';
        } else if (src.includes('staff')) {
          badgeLabel = 'Staff';
        } else if (src.includes('admin')) {
          badgeLabel = 'Admin';
        } else if (src.includes('global_mod')) {
          badgeLabel = 'Global Mod';
        } else if (src.includes('turbo')) {
          badgeLabel = 'Turbo';
        } else if (src.includes('premium') || src.includes('prime')) {
          badgeLabel = 'Prime';
        } else if (src.includes('founder')) {
          badgeLabel = 'Founder';
        } else if (src.includes('bits') || src.includes('cheer')) {
          const bitsMatch = src.match(/([0-9]+)/g);
          if (bitsMatch) {
            const amount = parseInt(bitsMatch[bitsMatch.length - 1]);
            badgeLabel = `Cheer ${amount >= 1000 ? Math.floor(amount/1000) + 'K' : amount}`;
          }
        }
        
        // Return badge object with image URL
        return {
          label: badgeLabel,
          imageUrl: src,
          alt: alt || title || badgeLabel
        };
      }).filter(badge => badge !== null);

      // Generate clean HTML with inline emotes based on text
      const messageHtml = this.generateMessageHtml(messageTextElement, emotes, messageText);
      console.log('📝 Generated messageHtml:', messageHtml);

      // Create a consistent ID based on message content and username
      const messageHash = this.hashString(`${username}-${messageText}`);
      const messageId = `twitch_${messageHash}_${username}`;
      
      const finalData = {
        id: messageId,
        username: username.toLowerCase(),
        displayName: username,
        message: messageText,
        timestamp: Date.now(),
        color: this.rgbToHex(userColor) || '#9146FF',
        badges: badges,
        emotes: emotes,
        messageHtml: messageHtml,
        source: 'extension'
      };
      
      console.log('✅ Final message data:', finalData);
      return finalData;
    } catch (error) {
      console.error('Error extracting message data:', error);
      return null;
    }
  }

  highlightMessage(element, messageId, messageData) {
    // Add visual highlight to the message
    element.classList.add('chat-highlighter-selected');
    element.setAttribute('data-highlight-id', messageId);
    
    // Add to our tracking
    this.highlightedMessages.add(messageId);

    // Send to target site (toggle API will add it)
    this.sendToTargetSite('toggle', messageId, messageData);

    // Show feedback
    this.showFeedback(element, 'Highlighted! ⭐', 'success');
  }

  unhighlightMessage(element, messageId, messageData) {
    // Remove visual highlight
    element.classList.remove('chat-highlighter-selected');
    element.removeAttribute('data-highlight-id');
    
    // Remove from tracking
    this.highlightedMessages.delete(messageId);

    // Send to target site (toggle API will remove it)
    this.sendToTargetSite('toggle', messageId, messageData);

    // Show feedback
    this.showFeedback(element, 'Removed ❌', 'remove');
  }

  async sendToTargetSite(action, messageId, messageData) {
    let retries = 3;
    
    while (retries > 0) {
      try {
        // Get server URL from extension settings
        const result = await chrome.storage.sync.get(['serverUrl', 'channelName']);
        const serverUrl = result.serverUrl || 'http://localhost:3000';
        const configuredChannel = result.channelName || 'general';
        
        // Extract channel from URL or use configured channel
        const urlChannel = this.getChannelFromUrl();
        const channel = urlChannel || configuredChannel || 'general';
        
        console.log(`🔧 Extension config:`, {
          serverUrl,
          configuredChannel,
          urlChannel,
          finalChannel: channel
        });
        
        console.log(`📤 Sending ${action} to: ${serverUrl}/api/highlights/${channel} (attempt ${4 - retries})`);
        console.log(`📦 Message data:`, messageData);
      
      // Use toggle API - single POST call that handles both add and remove
      const response = await fetch(`${serverUrl}/api/highlights/${channel}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
        console.error(`❌ Response body:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log(`✅ Toggle response:`, responseData);
      
      // Update local state based on server response
      if (responseData.action === 'added') {
        console.log('🌟 Message was added to highlights');
      } else if (responseData.action === 'removed') {
        console.log('🗑️ Message was removed from highlights');
      }

        console.log(`✅ ${action} sent successfully to channel ${channel}`);
        return; // Success, exit retry loop
        
      } catch (error) {
        console.error(`❌ Failed to send ${action} (attempt ${4 - retries}):`, error);
        console.error(`❌ Error details:`, {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        retries--;
        
        if (retries > 0) {
          console.log(`🔄 Retrying in 1 second... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          // All retries failed
          console.error(`❌ All retries failed for ${action}`);
          this.showGlobalFeedback(`Failed to ${action}: ${error.message}`, 'error');
        }
      }
    }
  }

  showFeedback(element, message, type) {
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = `chat-highlighter-feedback chat-highlighter-feedback--${type}`;
    feedback.textContent = message;
    
    // Position relative to message
    element.style.position = 'relative';
    element.appendChild(feedback);
    
    // Remove after animation
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 2000);
  }

  showGlobalFeedback(message, type) {
    // Create or update global feedback
    let feedback = document.getElementById('chat-highlighter-global-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.id = 'chat-highlighter-global-feedback';
      feedback.className = 'chat-highlighter-global-feedback';
      document.body.appendChild(feedback);
    }
    
    feedback.className = `chat-highlighter-global-feedback chat-highlighter-global-feedback--${type}`;
    feedback.textContent = message;
    feedback.style.display = 'block';
    
    setTimeout(() => {
      feedback.style.display = 'none';
    }, 4000);
  }

  addIndicator() {
    // Add minimal, dismissible status indicator
    const indicator = document.createElement('div');
    indicator.id = 'chat-highlighter-indicator';
    indicator.className = 'chat-highlighter-indicator';
    indicator.innerHTML = `
      <span class="indicator-content">
        <span class="indicator-text">⭐ Chat Highlighter Active</span>
        <button class="indicator-minimize" title="Minimize">−</button>
      </span>
    `;
    indicator.title = 'Hover over chat messages to see highlight button. Click - to minimize this indicator.';
    
    // Add click handler for minimize button
    const minimizeBtn = indicator.querySelector('.indicator-minimize');
    let isMinimized = localStorage.getItem('chatHighlighter_minimized') === 'true';
    
    const updateIndicatorState = () => {
      const textElement = indicator.querySelector('.indicator-text');
      if (isMinimized) {
        indicator.classList.add('minimized');
        textElement.textContent = '⭐';
        minimizeBtn.innerHTML = '+';
        minimizeBtn.title = 'Expand';
      } else {
        indicator.classList.remove('minimized');
        textElement.textContent = '⭐ Chat Highlighter Active';
        minimizeBtn.innerHTML = '−';
        minimizeBtn.title = 'Minimize';
      }
    };
    
    minimizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isMinimized = !isMinimized;
      localStorage.setItem('chatHighlighter_minimized', isMinimized.toString());
      updateIndicatorState();
    });
    
    // Initialize state
    updateIndicatorState();
    
    document.body.appendChild(indicator);
    this.updateUI();
  }

  updateUI() {
    const indicator = document.getElementById('chat-highlighter-indicator');
    if (indicator) {
      indicator.style.display = this.isEnabled ? 'block' : 'none';
    }

    // Update message highlights visibility
    const highlightedElements = document.querySelectorAll('.chat-highlighter-selected');
    highlightedElements.forEach(el => {
      el.style.opacity = this.isEnabled ? '1' : '0.5';
    });
  }

  observeNewMessages(chatContainer) {
    // Watch for new messages being added to chat
    const observer = new MutationObserver((mutations) => {
      if (!this.isEnabled) return;
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if this is a chat message - updated selectors
            if (node.matches && node.matches([
              '[data-a-target="chat-line-message"]',
              '.chat-line__message',
              '[data-test-selector="chat-line-message"]',
              '.Layout-sc-1xcs6mc-0:has([data-a-target="chat-line-message-body"])'
            ].join(','))) {
              // New message added, add highlight button
              console.log('🎯 New message detected, adding highlight button');
              this.addHighlightButton(node);
            }
            
            // Also check if any child elements are chat messages
            const childMessages = node.querySelectorAll([
              '[data-a-target="chat-line-message"]',
              '.chat-line__message',
              '[data-test-selector="chat-line-message"]'
            ].join(','));
            
            childMessages.forEach(messageElement => {
              console.log('🎯 Child message detected, adding highlight button');
              this.addHighlightButton(messageElement);
            });
          }
        });
      });
    });

    observer.observe(chatContainer, {
      childList: true,
      subtree: true
    });
  }

  getChannelFromUrl() {
    try {
      const url = window.location.href;
      // Match various Twitch URL patterns
      const patterns = [
        /twitch\.tv\/([^\/#?]+)/, // Basic channel URL
        /twitch\.tv\/popout\/moderator\/([^\/#?]+)\/chat/, // Moderator popout chat
        /twitch\.tv\/popout\/([^\/#?]+)\/chat/, // Regular popout chat
        /twitch\.tv\/embed\/([^\/#?]+)/, // Embed
        /twitch\.tv\/moderator\/([^\/#?]+)/, // Moderator view
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1] && match[1] !== 'directory' && match[1] !== 'following') {
          return match[1].toLowerCase();
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting channel from URL:', error);
      return null;
    }
  }

  rgbToHex(rgb) {
    if (!rgb) return '#9146FF';
    
    // Handle rgb() format
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }
    
    // If already hex, return as is
    if (rgb.startsWith('#')) return rgb;
    
    return '#9146FF'; // Default Twitch purple
  }
  
  // Simple hash function for consistent message IDs
  hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  async loadChannelInfo() {
    try {
      const url = window.location.href;
      this.channelName = this.getChannelFromUrl();
      
      if (this.channelName) {
        console.log('📺 Loading channel info for:', this.channelName);
        // We'll get channel ID from Twitch API if needed
        // For now, store channel name for emote fetching
      }
    } catch (error) {
      console.error('Error loading channel info:', error);
    }
  }

  async loadEmotes() {
    try {
      console.log('🎭 Loading Twitch emotes...');
      
      // Load fallback common emotes first
      this.loadFallbackEmotes();
      
      // Extract all emotes currently loaded on the page
      await this.extractEmotesFromDOM();
      
      // Load official Twitch emotes from API (may fail, that's ok)
      await this.loadGlobalEmotes();
      
      // Load channel-specific emotes if we have a channel
      if (this.channelName) {
        await this.loadChannelEmotes(this.channelName);
      }
      
      console.log('✅ Total emote cache loaded with', this.emoteCache.size, 'emotes');
      console.log('🎭 Available emotes:', Array.from(this.emoteCache.keys()).slice(0, 20));
    } catch (error) {
      console.error('Error loading emotes:', error);
    }
  }

  loadFallbackEmotes() {
    // Common Twitch emotes with their known IDs and URLs
    const commonEmotes = [
      { name: 'Kappa', id: '25', url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/light/1.0' },
      { name: 'PogChamp', id: '88', url: 'https://static-cdn.jtvnw.net/emoticons/v2/88/default/light/1.0' },
      { name: '4Head', id: '354', url: 'https://static-cdn.jtvnw.net/emoticons/v2/354/default/light/1.0' },
      { name: 'EZ', id: '5467', url: 'https://static-cdn.jtvnw.net/emoticons/v2/5467/default/light/1.0' },
      { name: 'LUL', id: '425618', url: 'https://static-cdn.jtvnw.net/emoticons/v2/425618/default/light/1.0' },
      { name: 'OMEGALUL', id: '81274', url: 'https://static-cdn.jtvnw.net/emoticons/v2/81274/default/light/1.0' },
      { name: '5Head', id: '117484', url: 'https://static-cdn.jtvnw.net/emoticons/v2/117484/default/light/1.0' },
      { name: 'MonkaS', id: '56', url: 'https://static-cdn.jtvnw.net/emoticons/v2/56/default/light/1.0' },
      { name: 'KEKW', id: '81273', url: 'https://static-cdn.jtvnw.net/emoticons/v2/81273/default/light/1.0' }
    ];
    
    commonEmotes.forEach(emote => {
      this.emoteCache.set(emote.name, {
        id: emote.id,
        name: emote.name,
        imageUrl: emote.url,
        imageUrl2x: emote.url.replace('/1.0', '/2.0'),
        imageUrl4x: emote.url.replace('/1.0', '/3.0'),
        type: 'fallback'
      });
    });
    
    console.log('🎭 Loaded', commonEmotes.length, 'fallback emotes');
    console.log('🎭 Fallback emotes in cache:', Array.from(this.emoteCache.keys()));
  }
  
  async extractEmotesFromDOM() {
    try {
      console.log('🔍 Extracting emotes from DOM...');
      
      // Find all emote images in the chat
      const emoteImages = document.querySelectorAll('img[alt]:not([class*="badge"])');
      let extractedCount = 0;
      
      emoteImages.forEach(img => {
        const alt = img.getAttribute('alt');
        const src = img.getAttribute('src');
        
        // Skip badges and non-emote images
        if (!alt || !src || 
            alt.includes('badge') || 
            src.includes('badge') ||
            alt.length < 2 || 
            alt.length > 25) {
          return;
        }
        
        // Check if it looks like a Twitch emote URL
        if (src.includes('static-cdn.jtvnw.net/emoticons') || 
            src.includes('emoticons.twitch.tv')) {
          
          // Extract emote ID from URL if possible
          const idMatch = src.match(/\/([0-9]+)\//); 
          const emoteId = idMatch ? idMatch[1] : alt;
          
          // Don't overwrite if we already have this emote
          if (!this.emoteCache.has(alt)) {
            this.emoteCache.set(alt, {
              id: emoteId,
              name: alt,
              imageUrl: src,
              imageUrl2x: src.replace('/1.0', '/2.0'),
              imageUrl4x: src.replace('/1.0', '/3.0'),
              type: 'dom-extracted'
            });
            extractedCount++;
          }
        }
      });
      
      console.log('🔍 Extracted', extractedCount, 'emotes from DOM');
      
      // Also check for emotes in the emote picker if it exists
      const emoteButtons = document.querySelectorAll('[data-a-target*="emote"] img, [class*="emote"] img');
      let pickerCount = 0;
      
      emoteButtons.forEach(img => {
        const alt = img.getAttribute('alt') || img.getAttribute('data-a-target');
        const src = img.getAttribute('src');
        
        if (alt && src && !this.emoteCache.has(alt) && 
            (src.includes('static-cdn.jtvnw.net/emoticons') || src.includes('emoticons.twitch.tv'))) {
          
          const idMatch = src.match(/\/([0-9]+)\//); 
          const emoteId = idMatch ? idMatch[1] : alt;
          
          this.emoteCache.set(alt, {
            id: emoteId,
            name: alt,
            imageUrl: src,
            imageUrl2x: src.replace('/1.0', '/2.0'),
            imageUrl4x: src.replace('/1.0', '/3.0'),
            type: 'picker-extracted'
          });
          pickerCount++;
        }
      });
      
      console.log('🔍 Found', pickerCount, 'additional emotes from emote picker');
      console.log('🔍 Total DOM extraction:', extractedCount + pickerCount, 'new emotes');
      
    } catch (error) {
      console.error('Error extracting emotes from DOM:', error);
    }
  }

  async loadGlobalEmotes() {
    try {
      console.log('🌐 Attempting to load global emotes...');
      
      // Try multiple client IDs and approaches
      const clientIds = [
        'kimne78kx3ncx6brgo4mv6wki5h1ko', // Twitch web client
        'kd1unb4b3q4t58fwlpcbzcbnm76a8fp', // Another known client
        'jzkbprff40iqj646a697cyrvl0zt2m6', // Third option
      ];
      
      for (const clientId of clientIds) {
        try {
          const response = await fetch('https://api.twitch.tv/helix/chat/emotes/global', {
            headers: {
              'Client-ID': clientId
            }
          });
          
          console.log('🌐 Global emotes API response status:', response.status, 'with client:', clientId.substring(0, 8) + '...');
          
          if (response.ok) {
            const data = await response.json();
            console.log('🌐 Global emotes API response:', data);
            
            if (data.data && Array.isArray(data.data)) {
              let loadedCount = 0;
              data.data.forEach(emote => {
                if (emote.name && emote.images && emote.images.url_1x) {
                  this.emoteCache.set(emote.name, {
                    id: emote.id,
                    name: emote.name,
                    imageUrl: emote.images.url_1x,
                    imageUrl2x: emote.images.url_2x || emote.images.url_1x,
                    imageUrl4x: emote.images.url_4x || emote.images.url_1x,
                    type: 'global'
                  });
                  loadedCount++;
                }
              });
              console.log('🌐 Successfully loaded', loadedCount, 'global emotes with client:', clientId.substring(0, 8) + '...');
              return; // Success, exit the loop
            }
          } else {
            const errorText = await response.text();
            console.warn('🌐 Failed with client', clientId.substring(0, 8) + '... Status:', response.status, 'Response:', errorText);
          }
        } catch (clientError) {
          console.warn('🌐 Error with client', clientId.substring(0, 8) + '...:', clientError);
        }
      }
      
      console.warn('🌐 All client IDs failed for global emotes');
      
    } catch (error) {
      console.error('🌐 Error loading global emotes:', error);
    }
  }

  async loadChannelEmotes(channelName) {
    try {
      // First get channel ID from username
      const userResponse = await fetch(`https://api.twitch.tv/helix/users?login=${channelName}`, {
        headers: {
          'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko'
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const channelId = userData.data?.[0]?.id;
        
        if (channelId) {
          this.channelId = channelId;
          
          // Get channel emotes
          const emotesResponse = await fetch(`https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${channelId}`, {
            headers: {
              'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko'
            }
          });
          
          if (emotesResponse.ok) {
            const emotesData = await emotesResponse.json();
            emotesData.data?.forEach(emote => {
              this.emoteCache.set(emote.name, {
                id: emote.id,
                name: emote.name,
                imageUrl: emote.images.url_1x,
                imageUrl2x: emote.images.url_2x,
                imageUrl4x: emote.images.url_4x,
                type: 'channel'
              });
            });
            console.log('📺 Loaded', emotesData.data?.length || 0, 'channel emotes for', channelName);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load channel emotes:', error);
    }
  }

  // Generate HTML version of message with emotes
  generateMessageHtml(messageElement, emotes, fallbackText) {
    try {
      console.log('🎭 generateMessageHtml called with', emotes.length, 'emotes');
      
      if (!messageElement) {
        console.log('⚠️ No message element provided for HTML generation');
        return this.parseTextForEmotes(fallbackText || '');
      }
      
      // Extract clean text from the message element
      const cleanText = this.extractMessageText(messageElement);
      console.log('🎭 Extracted clean text:', cleanText);
      
      // Parse the clean text for emotes and generate inline HTML
      const result = this.parseTextForEmotes(cleanText);
      console.log('🎭 Generated HTML:', result);
      return result;
    } catch (error) {
      console.error('Error generating message HTML:', error);
      return this.parseTextForEmotes(fallbackText || messageElement?.textContent || '');
    }
  }
  
  parseTextForEmotes(text) {
    try {
      console.log('🎭 parseTextForEmotes called with:', text);
      console.log('🎭 Emote cache size:', this.emoteCache.size);
      
      if (!text || this.emoteCache.size === 0) {
        console.log('🎭 No text or empty emote cache, returning original text');
        return this.escapeHtml(text);
      }
      
      // Split text by spaces to find potential emote names
      const words = text.split(' ');
      const htmlParts = [];
      let foundEmotes = 0;
      
      for (const word of words) {
        // Check if this word is an emote in our cache
        console.log('🎭 Checking word:', `"${word}"`, 'in cache...');
        const emoteData = this.emoteCache.get(word);
        
        if (emoteData) {
          console.log('🎭 ✅ Found emote:', word, emoteData);
          foundEmotes++;
          // Replace with simple inline emote image
          htmlParts.push(
            `<img src="${emoteData.imageUrl}" alt="${emoteData.name}" title="${emoteData.name}" class="emote-image" style="height: 1.4em; width: auto; vertical-align: middle; margin: 0 1px; display: inline;" />`
          );
        } else {
          console.log('🎭 ❌ Not found in cache:', `"${word}"`);
          // Keep as text
          htmlParts.push(this.escapeHtml(word));
        }
      }
      
      const result = htmlParts.join(' ');
      console.log('🎭 Found', foundEmotes, 'emotes in text. Result:', result);
      return result;
    } catch (error) {
      console.error('Error parsing text for emotes:', error);
      return this.escapeHtml(text);
    }
  }
  
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the highlighter
const highlighter = new TwitchChatHighlighter();

// Export for popup communication
window.chatHighlighter = highlighter;
