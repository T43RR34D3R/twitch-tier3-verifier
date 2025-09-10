// Enhanced Twitch Chat Highlighter - Content Script
console.log('🎯 Enhanced Twitch Chat Highlighter loaded!');

class TwitchChatHighlighter {
  constructor() {
    this.isEnabled = true;
    this.highlightedMessages = new Set();
    this.init();
  }

  async init() {
    // Get settings from extension storage
    await this.loadSettings();
    
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
    // Use event delegation to catch clicks on chat messages
    chatContainer.addEventListener('click', (event) => {
      if (!this.isEnabled) return;

      // Find the closest chat message element - robust approach for Twitch's dynamic DOM
      let messageElement = event.target.closest([
        '[data-a-target="chat-line-message"]',
        '.chat-line__message', 
        '[data-test-selector="chat-line-message"]'
      ].join(','));
      
      // Fallback: look for elements containing message body or username
      if (!messageElement) {
        messageElement = event.target.closest('[class*="Layout-sc-"]');
        // Verify it contains a message by checking for message body
        if (messageElement && !messageElement.querySelector('[data-a-target*="message"], .text-fragment')) {
          messageElement = null;
        }
      }

      if (messageElement) {
        console.log('🎯 Message element found:', messageElement);
        event.preventDefault();
        event.stopPropagation();
        this.handleMessageClick(messageElement);
      } else {
        console.log('❌ No message element found for click target:', event.target);
      }
    }, true);

    // Also setup observer for new messages
    this.observeNewMessages(chatContainer);
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
      // Extract username - updated selectors based on DOM inspection
      const usernameElement = messageElement.querySelector([
        '[data-a-target="chat-message-username"]',
        '[data-test-selector="message-username"]', 
        '.chat-author__display-name',
        '[data-a-target="chat-line-username"]',
        '.chat-line__username'
      ].join(','));

      // Extract message text - updated selectors 
      const messageTextElement = messageElement.querySelector([
        '[data-a-target="chat-line-message-body"]',
        '[data-a-target="chat-message-text"]',
        '.text-fragment',
        '.chat-line__message-body'
      ].join(','));

      // Extract badges
      const badgeElements = messageElement.querySelectorAll([
        '.chat-badge',
        '[data-a-target*="badge"]'
      ].join(','));

      // Extract user color
      const colorElement = usernameElement || messageElement.querySelector('[style*="color"]');
      const userColor = colorElement ? 
        window.getComputedStyle(colorElement).color || '#ffffff' : '#ffffff';

      if (!usernameElement || !messageTextElement) {
        console.log('⚠️ Could not extract message data:');
        console.log('Username element:', usernameElement);
        console.log('Message text element:', messageTextElement);
        console.log('Full message element:', messageElement);
        return null;
      }

      const username = usernameElement.textContent.trim();
      const messageText = messageTextElement.textContent.trim();
      const badges = Array.from(badgeElements).map(badge => 
        badge.getAttribute('alt') || badge.getAttribute('title') || 'badge'
      );

      // Create a consistent ID based on message content and username
      const messageHash = this.hashString(`${username}-${messageText}`);
      const messageId = `twitch_${messageHash}_${username}`;
      
      return {
        id: messageId,
        username: username.toLowerCase(),
        displayName: username,
        message: messageText,
        timestamp: Date.now(),
        color: this.rgbToHex(userColor) || '#9146FF',
        badges: badges,
        source: 'extension'
      };
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
    indicator.title = 'Click any chat message to highlight it. Click - to minimize this indicator.';
    
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
              // New message added, could add hover effects etc.
            }
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
}

// Initialize the highlighter
const highlighter = new TwitchChatHighlighter();

// Export for popup communication
window.chatHighlighter = highlighter;
