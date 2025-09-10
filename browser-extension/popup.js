// Popup script for Twitch Chat Highlighter Extension

// DOM Elements
const elements = {
  status: document.getElementById('status'),
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  serverUrl: document.getElementById('serverUrl'),
  channelName: document.getElementById('channelName'),
  saveConfig: document.getElementById('saveConfig'),
  testConnection: document.getElementById('testConnection'),
  highlightCount: document.getElementById('highlightCount'),
  sessionTime: document.getElementById('sessionTime'),
  highlightsList: document.getElementById('highlightsList'),
  emptyState: document.getElementById('emptyState'),
  clearAll: document.getElementById('clearAll'),
  toggleExtension: document.getElementById('toggleExtension'),
  toggleText: document.getElementById('toggleText'),
  openSettings: document.getElementById('openSettings'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettings: document.getElementById('closeSettings'),
  autoSave: document.getElementById('autoSave'),
  showNotifications: document.getElementById('showNotifications'),
  debugMode: document.getElementById('debugMode'),
  maxHighlights: document.getElementById('maxHighlights'),
  saveSettings: document.getElementById('saveSettings'),
  resetSettings: document.getElementById('resetSettings'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  helpLink: document.getElementById('helpLink'),
  aboutLink: document.getElementById('aboutLink')
};

// State
let extensionState = {
  enabled: true,
  serverUrl: 'http://localhost:3000',
  channelName: '',
  highlights: [],
  sessionStartTime: Date.now(),
  settings: {
    autoSave: true,
    showNotifications: true,
    debugMode: false,
    maxHighlights: 50
  }
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup initialized');
  await loadStoredData();
  setupEventListeners();
  updateUI();
  startSessionTimer();
  checkServerStatus();
});

// Load stored data from chrome.storage
async function loadStoredData() {
  try {
    const result = await chrome.storage.sync.get([
      'extensionEnabled',
      'serverUrl',
      'channelName',
      'highlights',
      'sessionStartTime',
      'settings'
    ]);

    if (result.extensionEnabled !== undefined) {
      extensionState.enabled = result.extensionEnabled;
    }
    
    if (result.serverUrl) {
      extensionState.serverUrl = result.serverUrl;
    }
    
    if (result.channelName) {
      extensionState.channelName = result.channelName;
    }
    
    if (result.highlights) {
      extensionState.highlights = result.highlights;
    }
    
    if (result.sessionStartTime) {
      extensionState.sessionStartTime = result.sessionStartTime;
    }
    
    if (result.settings) {
      extensionState.settings = { ...extensionState.settings, ...result.settings };
    }
  } catch (error) {
    console.error('Error loading stored data:', error);
  }
}

// Save data to chrome.storage
async function saveStoredData() {
  try {
    await chrome.storage.sync.set({
      extensionEnabled: extensionState.enabled,
      serverUrl: extensionState.serverUrl,
      channelName: extensionState.channelName,
      highlights: extensionState.highlights,
      sessionStartTime: extensionState.sessionStartTime,
      settings: extensionState.settings
    });
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Configuration
  elements.saveConfig.addEventListener('click', handleSaveConfig);
  elements.testConnection.addEventListener('click', handleTestConnection);
  
  // Controls
  elements.toggleExtension.addEventListener('click', handleToggleExtension);
  elements.clearAll.addEventListener('click', handleClearAll);
  
  // Settings modal
  elements.openSettings.addEventListener('click', () => showModal(elements.settingsModal));
  elements.closeSettings.addEventListener('click', () => hideModal(elements.settingsModal));
  elements.saveSettings.addEventListener('click', handleSaveSettings);
  elements.resetSettings.addEventListener('click', handleResetSettings);
  
  // Footer links
  elements.helpLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/your-repo/browser-extension#help' });
  });
  
  elements.aboutLink.addEventListener('click', (e) => {
    e.preventDefault();
    showAboutDialog();
  });
  
  // Modal overlay click to close
  elements.settingsModal.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) {
      hideModal(elements.settingsModal);
    }
  });
  
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener(handleMessage);
}

// Handle test connection
async function handleTestConnection() {
  const serverUrl = elements.serverUrl.value.trim() || extensionState.serverUrl;
  const channelName = elements.channelName.value.trim().toLowerCase() || extensionState.channelName;
  
  if (!serverUrl || !channelName) {
    showError('Please enter server URL and channel name first');
    return;
  }
  
  showLoading(true);
  
  try {
    // Test POST request like content script does
    const testData = {
      id: `test_${Date.now()}`,
      username: 'testuser',
      displayName: 'TestUser', 
      message: 'Test highlight from extension popup',
      timestamp: Date.now(),
      color: '#FF0000',
      badges: ['test'],
      source: 'popup-test'
    };
    
    console.log(`Testing POST to: ${serverUrl}/api/highlights/${channelName}`);
    console.log('Test data:', testData);
    
    const response = await fetch(`${serverUrl}/api/highlights/${channelName}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
      showSuccess('✅ POST test successful! Check console for details.');
    } else {
      const errorText = await response.text();
      console.error('HTTP Error:', response.status, response.statusText);
      console.error('Error body:', errorText);
      showError(`POST failed: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('Test connection error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    showError(`Connection test failed: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

// Handle save configuration
async function handleSaveConfig() {
  const serverUrl = elements.serverUrl.value.trim();
  const channelName = elements.channelName.value.trim().toLowerCase();
  
  if (!serverUrl) {
    showError('Please enter a server URL');
    return;
  }
  
  if (!channelName) {
    showError('Please enter a channel name');
    return;
  }
  
  // Validate URL format
  try {
    new URL(serverUrl);
  } catch {
    showError('Please enter a valid server URL');
    return;
  }
  
  showLoading(true);
  
  try {
    console.log(`Testing connection to: ${serverUrl}/api/highlights/${channelName}`);
    
    // Test server connection
    const response = await fetch(`${serverUrl}/api/highlights/${channelName}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors'
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Server response:`, data);
      
      extensionState.serverUrl = serverUrl;
      extensionState.channelName = channelName;
      await saveStoredData();
      
      // Notify content script of config change
      await notifyContentScript('CONFIG_UPDATED', {
        serverUrl: extensionState.serverUrl,
        channelName: extensionState.channelName
      });
      
      showSuccess('Configuration saved successfully!');
      updateUI();
    } else {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      showError(`Server returned ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Config save error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    showError(`Connection failed: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

// Handle toggle extension
async function handleToggleExtension() {
  extensionState.enabled = !extensionState.enabled;
  await saveStoredData();
  
  // Notify content script
  await notifyContentScript('EXTENSION_TOGGLED', { enabled: extensionState.enabled });
  
  updateUI();
  showSuccess(extensionState.enabled ? 'Extension enabled' : 'Extension disabled');
}

// Handle clear all highlights
async function handleClearAll() {
  if (extensionState.highlights.length === 0) return;
  
  showLoading(true);
  
  try {
    // Clear on server if configured
    if (extensionState.serverUrl && extensionState.channelName && extensionState.settings.autoSave) {
      await fetch(`${extensionState.serverUrl}/api/highlights/${extensionState.channelName}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Clear locally
    extensionState.highlights = [];
    await saveStoredData();
    
    // Notify content script
    await notifyContentScript('CLEAR_ALL_HIGHLIGHTS');
    
    updateUI();
    showSuccess('All highlights cleared');
  } catch (error) {
    console.error('Clear all error:', error);
    showError('Failed to clear highlights');
  } finally {
    showLoading(false);
  }
}

// Handle save settings
async function handleSaveSettings() {
  extensionState.settings = {
    autoSave: elements.autoSave.checked,
    showNotifications: elements.showNotifications.checked,
    debugMode: elements.debugMode.checked,
    maxHighlights: parseInt(elements.maxHighlights.value, 10)
  };
  
  await saveStoredData();
  
  // Notify content script of settings change
  await notifyContentScript('SETTINGS_UPDATED', extensionState.settings);
  
  hideModal(elements.settingsModal);
  showSuccess('Settings saved');
}

// Handle reset settings
function handleResetSettings() {
  extensionState.settings = {
    autoSave: true,
    showNotifications: true,
    debugMode: false,
    maxHighlights: 50
  };
  
  updateSettingsUI();
}

// Handle messages from content script
function handleMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'HIGHLIGHT_ADDED':
      extensionState.highlights.push(request.data);
      updateUI();
      break;
      
    case 'HIGHLIGHT_REMOVED':
      extensionState.highlights = extensionState.highlights.filter(h => h.id !== request.data.id);
      updateUI();
      break;
      
    case 'SYNC_HIGHLIGHTS':
      if (request.data) {
        extensionState.highlights = request.data;
        updateUI();
      }
      break;
      
    case 'STATUS_UPDATE':
      updateConnectionStatus(request.data.status, request.data.message);
      break;
  }
}

// Notify content script
async function notifyContentScript(action, data = null) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('twitch.tv')) {
      await chrome.tabs.sendMessage(tab.id, { action, data });
    }
  } catch (error) {
    console.error('Error notifying content script:', error);
  }
}

// Update UI
function updateUI() {
  // Update config inputs
  elements.serverUrl.value = extensionState.serverUrl;
  elements.channelName.value = extensionState.channelName;
  
  // Update toggle button
  elements.toggleExtension.className = `btn btn-toggle ${extensionState.enabled ? 'enabled' : ''}`;
  elements.toggleText.textContent = extensionState.enabled ? 'Disable' : 'Enable';
  
  // Update stats
  elements.highlightCount.textContent = extensionState.highlights.length;
  
  // Update highlights list
  updateHighlightsList();
  
  // Update settings
  updateSettingsUI();
}

// Update settings UI
function updateSettingsUI() {
  elements.autoSave.checked = extensionState.settings.autoSave;
  elements.showNotifications.checked = extensionState.settings.showNotifications;
  elements.debugMode.checked = extensionState.settings.debugMode;
  elements.maxHighlights.value = extensionState.settings.maxHighlights;
}

// Update highlights list
function updateHighlightsList() {
  if (extensionState.highlights.length === 0) {
    elements.highlightsList.innerHTML = `
      <div class="empty-state">
        <span>No highlights yet</span>
        <small>Click on Twitch chat messages to highlight them!</small>
      </div>
    `;
    return;
  }
  
  elements.highlightsList.innerHTML = extensionState.highlights
    .slice(-10) // Show last 10 highlights
    .reverse()
    .map(highlight => `
      <div class="highlight-item" data-id="${highlight.id}">
        <div class="highlight-content">
          <div class="highlight-username" style="color: ${highlight.color || '#9146ff'}">${highlight.username}</div>
          <div class="highlight-message">${escapeHtml(highlight.message)}</div>
        </div>
        <button class="highlight-remove" onclick="removeHighlight('${highlight.id}')" title="Remove highlight">×</button>
      </div>
    `)
    .join('');
}

// Remove individual highlight
async function removeHighlight(highlightId) {
  try {
    extensionState.highlights = extensionState.highlights.filter(h => h.id !== highlightId);
    await saveStoredData();
    
    // Notify content script
    await notifyContentScript('REMOVE_HIGHLIGHT', { id: highlightId });
    
    updateUI();
  } catch (error) {
    console.error('Error removing highlight:', error);
  }
}

// Make removeHighlight available globally
window.removeHighlight = removeHighlight;

// Check server status
async function checkServerStatus() {
  if (!extensionState.serverUrl || !extensionState.channelName) {
    updateConnectionStatus('disconnected', 'Not configured');
    return;
  }
  
  updateConnectionStatus('connecting', 'Connecting...');
  
  try {
    const response = await fetch(`${extensionState.serverUrl}/api/highlights/${extensionState.channelName}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      updateConnectionStatus('connected', 'Connected');
      
      // Sync highlights from server
      const serverHighlights = await response.json();
      if (serverHighlights && Array.isArray(serverHighlights)) {
        extensionState.highlights = serverHighlights;
        updateUI();
      }
    } else {
      updateConnectionStatus('disconnected', 'Server error');
    }
  } catch (error) {
    console.error('Server check error:', error);
    updateConnectionStatus('disconnected', 'Connection failed');
  }
}

// Update connection status
function updateConnectionStatus(status, message) {
  elements.statusText.textContent = message;
  elements.statusDot.className = `status-dot ${status}`;
}

// Start session timer
function startSessionTimer() {
  setInterval(() => {
    const sessionMinutes = Math.floor((Date.now() - extensionState.sessionStartTime) / 60000);
    elements.sessionTime.textContent = sessionMinutes < 60 ? 
      `${sessionMinutes}m` : 
      `${Math.floor(sessionMinutes / 60)}h ${sessionMinutes % 60}m`;
  }, 60000); // Update every minute
}

// UI Helper functions
function showModal(modal) {
  modal.style.display = 'flex';
}

function hideModal(modal) {
  modal.style.display = 'none';
}

function showLoading(show) {
  elements.loadingOverlay.style.display = show ? 'flex' : 'none';
}

function showSuccess(message) {
  console.log('Success:', message);
  // Could implement toast notifications here
}

function showError(message) {
  console.error('Error:', message);
  alert(message); // Simple alert for now, could be improved
}

function showAboutDialog() {
  alert(`Twitch Chat Highlighter v1.0\n\nA browser extension to highlight and track Twitch chat messages.\n\nDeveloped for enhanced streaming workflows.`);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Close modals
    hideModal(elements.settingsModal);
  }
});

console.log('Popup script loaded');
