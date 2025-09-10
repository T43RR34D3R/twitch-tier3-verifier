// Background script for Twitch Chat Highlighter Extension

// Extension state
let extensionData = {
  enabled: true,
  highlights: [],
  settings: {
    autoSave: true,
    showNotifications: true,
    debugMode: false,
    maxHighlights: 50
  }
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // First install - set default values
    await chrome.storage.sync.set({
      extensionEnabled: true,
      serverUrl: 'http://localhost:3000',
      channelName: '',
      highlights: [],
      sessionStartTime: Date.now(),
      settings: extensionData.settings
    });
    
    console.log('Default settings initialized');
    
    // Open welcome page or instructions
    if (chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({
        url: chrome.runtime.getURL('welcome.html')
      });
    }
  } else if (details.reason === 'update') {
    // Extension updated - migrate settings if needed
    console.log('Extension updated from version:', details.previousVersion);
    await migrateSettings(details.previousVersion);
  }
});

// Extension startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('Extension starting up');
  await loadStoredData();
});

// Load stored data
async function loadStoredData() {
  try {
    const result = await chrome.storage.sync.get([
      'extensionEnabled',
      'highlights',
      'settings'
    ]);
    
    if (result.extensionEnabled !== undefined) {
      extensionData.enabled = result.extensionEnabled;
    }
    
    if (result.highlights) {
      extensionData.highlights = result.highlights;
    }
    
    if (result.settings) {
      extensionData.settings = { ...extensionData.settings, ...result.settings };
    }
    
    console.log('Extension data loaded:', extensionData);
  } catch (error) {
    console.error('Error loading stored data:', error);
  }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.action, 'from', sender.tab ? 'content' : 'popup');
  
  switch (request.action) {
    case 'GET_EXTENSION_STATE':
      sendResponse(extensionData);
      break;
      
    case 'UPDATE_HIGHLIGHTS':
      handleUpdateHighlights(request.data);
      sendResponse({ success: true });
      break;
      
    case 'CLEAR_HIGHLIGHTS':
      handleClearHighlights();
      sendResponse({ success: true });
      break;
      
    case 'SYNC_WITH_POPUP':
      // Forward message to popup if open
      forwardToPopup(request);
      sendResponse({ success: true });
      break;
      
    case 'BACKGROUND_SYNC':
      // Sync data between content script and popup
      handleBackgroundSync(request.data, sender);
      sendResponse({ success: true });
      break;
      
    default:
      console.log('Unknown action:', request.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  return true; // Will respond asynchronously
});

// Handle highlight updates
async function handleUpdateHighlights(highlights) {
  try {
    extensionData.highlights = highlights;
    
    // Store in chrome.storage
    await chrome.storage.sync.set({ highlights });
    
    // Enforce max highlights limit
    if (highlights.length > extensionData.settings.maxHighlights) {
      const trimmedHighlights = highlights.slice(-extensionData.settings.maxHighlights);
      extensionData.highlights = trimmedHighlights;
      await chrome.storage.sync.set({ highlights: trimmedHighlights });
    }
    
    console.log('Highlights updated:', highlights.length, 'total');
  } catch (error) {
    console.error('Error updating highlights:', error);
  }
}

// Handle clear highlights
async function handleClearHighlights() {
  try {
    extensionData.highlights = [];
    await chrome.storage.sync.set({ highlights: [] });
    console.log('All highlights cleared');
  } catch (error) {
    console.error('Error clearing highlights:', error);
  }
}

// Handle background sync between scripts
function handleBackgroundSync(data, sender) {
  if (data.type === 'HIGHLIGHT_CHANGE') {
    // Notify all other tabs about highlight changes
    broadcastToContentScripts(sender.tab.id, {
      action: 'HIGHLIGHT_SYNC',
      data: data.highlights
    });
  }
}

// Forward messages to popup
function forwardToPopup(message) {
  // Note: Cannot directly send to popup, it needs to query the background
  console.log('Would forward to popup:', message);
}

// Broadcast to all content scripts except sender
async function broadcastToContentScripts(senderTabId, message) {
  try {
    const tabs = await chrome.tabs.query({ url: '*://*.twitch.tv/*' });
    
    for (const tab of tabs) {
      if (tab.id !== senderTabId) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Tab might not have content script loaded, ignore
          console.log('Could not send to tab', tab.id, ':', error.message);
        }
      }
    }
  } catch (error) {
    console.error('Error broadcasting to content scripts:', error);
  }
}

// Migrate settings from previous versions
async function migrateSettings(previousVersion) {
  try {
    console.log('Migrating settings from version:', previousVersion);
    
    // Add any version-specific migration logic here
    const currentData = await chrome.storage.sync.get();
    
    // Example migration: add new settings that didn't exist in older versions
    if (!currentData.settings || !currentData.settings.hasOwnProperty('maxHighlights')) {
      const updatedSettings = {
        ...extensionData.settings,
        ...currentData.settings
      };
      
      await chrome.storage.sync.set({ settings: updatedSettings });
      console.log('Settings migrated successfully');
    }
  } catch (error) {
    console.error('Error migrating settings:', error);
  }
}

// Handle tab updates to inject content script
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only proceed when the page has finished loading
  if (changeInfo.status !== 'complete') return;
  
  // Check if it's a Twitch page
  if (tab.url && tab.url.includes('twitch.tv') && extensionData.enabled) {
    try {
      // Test if content script is already injected
      await chrome.tabs.sendMessage(tabId, { action: 'PING' });
    } catch (error) {
      // Content script not loaded, inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content.js']
        });
        
        // Also inject CSS
        await chrome.scripting.insertCSS({
          target: { tabId },
          files: ['content-styles.css']
        });
        
        console.log('Content script injected into tab:', tabId);
      } catch (injectionError) {
        console.error('Error injecting content script:', injectionError);
      }
    }
  }
});

// Handle tab removal to clean up data
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log('Tab removed:', tabId);
  // Clean up any tab-specific data if needed
});

// Periodic cleanup
setInterval(async () => {
  try {
    // Clean up old highlights if needed
    if (extensionData.highlights.length > extensionData.settings.maxHighlights * 1.5) {
      console.log('Performing highlight cleanup...');
      
      const trimmedHighlights = extensionData.highlights.slice(-extensionData.settings.maxHighlights);
      extensionData.highlights = trimmedHighlights;
      
      await chrome.storage.sync.set({ highlights: trimmedHighlights });
      console.log('Highlights cleaned up, kept', trimmedHighlights.length, 'items');
    }
  } catch (error) {
    console.error('Error during periodic cleanup:', error);
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Handle extension uninstall (for cleanup)
chrome.runtime.setUninstallURL('https://forms.gle/feedback-survey-url');

// Initialize extension data on startup
loadStoredData();

console.log('Background script initialized');
