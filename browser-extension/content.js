// Enhanced Twitch Chat Highlighter - Content Script
console.log('🎯 Enhanced Twitch Chat Highlighter loaded!');

class TwitchChatHighlighter {
  constructor() {
    this.isEnabled = true;
    this.highlightedMessages = new Set();
    this.targetSiteUrl = 'http://localhost:3000'; // Will be configurable
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
      } else if (message.type === 'set_target_url') {
        this.targetSiteUrl = message.url;
        this.saveSettings();
      }
      sendResponse({ success: true });
    });

    // Add visual indicator
    this.addIndicator();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['targetUrl', 'enabled']);
      this.targetSiteUrl = result.targetUrl || 'http://localhost:3000';
      this.isEnabled = result.enabled !== false; // Default to enabled
    } catch (error) {
      console.log('Using default settings');
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({
        targetUrl: this.targetSiteUrl,
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
        const messageId = messageData.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Check if already highlighted
        if (this.highlightedMessages.has(messageId)) {
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

      return {
        id: `twitch_${Date.now()}_${username}`,
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

    // Send to target site
    this.sendToTargetSite('highlight', messageId, messageData);

    // Show feedback
    this.showFeedback(element, 'Highlighted! ⭐', 'success');
  }

  unhighlightMessage(element, messageId, messageData) {
    // Remove visual highlight
    element.classList.remove('chat-highlighter-selected');
    element.removeAttribute('data-highlight-id');
    
    // Remove from tracking
    this.highlightedMessages.delete(messageId);

    // Send unhighlight to target site
    this.sendToTargetSite('unhighlight', messageId, messageData);

    // Show feedback
    this.showFeedback(element, 'Removed ❌', 'remove');
  }

  async sendToTargetSite(action, messageId, messageData) {
    try {
      // Extract channel from URL or use default
      const channel = this.getChannelFromUrl() || 'general';
      
      if (action === 'highlight') {
        // Add highlight via new API
        const response = await fetch(`${this.targetSiteUrl}/api/highlights/${channel}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messageData)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      } else if (action === 'unhighlight') {
        // Remove highlight via new API
        const response = await fetch(`${this.targetSiteUrl}/api/highlights/${channel}?id=${messageId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      }

      console.log(`✅ ${action} sent successfully to channel ${channel}`);
    } catch (error) {
      console.error(`❌ Failed to send ${action}:`, error);
      // Show error feedback
      this.showGlobalFeedback('Connection failed! Check if your site is running.', 'error');
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
    // Add status indicator to show extension is active
    const indicator = document.createElement('div');
    indicator.id = 'chat-highlighter-indicator';
    indicator.className = 'chat-highlighter-indicator';
    indicator.innerHTML = '⭐ Chat Highlighter Active';
    indicator.title = 'Click any chat message to highlight it in OBS';
    
    document.body.appendChild(indicator);

    // Toggle indicator based on enabled state
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
        /twitch\.tv\/popout\/([^\/#?]+)\/chat/, // Popout chat
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
}

// Initialize the highlighter
const highlighter = new TwitchChatHighlighter();

// Export for popup communication
window.chatHighlighter = highlighter;
