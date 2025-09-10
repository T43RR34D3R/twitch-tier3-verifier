"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface HighlightedMessage {
  id: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: number;
  color: string;
  badges: string[];
}

interface ChatSettings {
  fontSize: number;
  chatTheme: 'dark' | 'light';
  showHighlightOverlay: boolean;
  overlayPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export default function TwitchChatPage() {
  const { data: session } = useSession();
  const [channelName, setChannelName] = useState('buckfoozle');
  const [settings, setSettings] = useState<ChatSettings>({
    fontSize: 14,
    chatTheme: 'dark',
    showHighlightOverlay: true,
    overlayPosition: 'top-right'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [highlightedMessages, setHighlightedMessages] = useState<HighlightedMessage[]>([]);
  const [isPopout, setIsPopout] = useState(false);

  useEffect(() => {
    // Check if this is a popout window
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setIsPopout(urlParams.get('popout') === 'true');
      const channelParam = urlParams.get('channel');
      if (channelParam) {
        setChannelName(channelParam);
      }
    }
  }, []);

  // Fetch highlighted messages
  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const response = await fetch('/api/twitch/chat?type=highlights');
        const data = await response.json();
        if (data.highlights) {
          setHighlightedMessages(data.highlights);
        }
      } catch (error) {
        console.error('Failed to fetch highlights:', error);
      }
    };

    fetchHighlights();
    const interval = setInterval(fetchHighlights, 2000);
    return () => clearInterval(interval);
  }, []);

  const openPopout = () => {
    const popoutUrl = `/twitch-chat?popout=true&channel=${channelName}`;
    const popoutWindow = window.open(
      popoutUrl,
      'twitchChatPopout',
      'width=1200,height=800,scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no'
    );
    
    if (popoutWindow) {
      popoutWindow.focus();
    }
  };

  const clearHighlights = async () => {
    try {
      await fetch('/api/twitch/chat', { method: 'DELETE' });
      setHighlightedMessages([]);
    } catch (error) {
      console.error('Error clearing highlights:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Check if user is mod/admin
  const isUserMod = session?.user?.name && (['TearReader', 'BuckFoozle'].includes(session.user.name) || session.user.id === '269187200');

  const getChatUrl = () => {
    const baseUrl = `https://www.twitch.tv/popout/${channelName}/chat`;
    const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    
    // Use mod view if user is a moderator
    if (isUserMod) {
      return `${baseUrl}?popout=&moderator=true&parent=${parent}`;
    }
    
    return `${baseUrl}?popout=&parent=${parent}`;
  };

  return (
    <div className={`min-h-screen flex flex-col ${
      settings.chatTheme === 'dark' ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 shrink-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {!isPopout && (
                <Link href="/" className="text-white hover:text-purple-300 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
              )}
              <h1 className="text-xl font-bold text-white">
                {isPopout ? 'Chat Popout' : 'Enhanced Twitch Chat'}
              </h1>
              {isUserMod && (
                <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
                  MOD VIEW
                </div>
              )}
              {highlightedMessages.length > 0 && (
                <div className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold">
                  {highlightedMessages.length} HIGHLIGHTED
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Channel name..."
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 text-sm"
              />
              
              {!isPopout && (
                <button
                  onClick={openPopout}
                  className="p-2 text-white hover:bg-white/10 rounded transition-colors"
                  title="Pop out chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              )}

              {highlightedMessages.length > 0 && (
                <button
                  onClick={clearHighlights}
                  className="p-2 text-yellow-400 hover:bg-white/10 rounded transition-colors"
                  title="Clear all highlights"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-white hover:bg-white/10 rounded transition-colors"
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="p-2 text-white hover:bg-white/10 rounded transition-colors"
                title="Fullscreen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 p-4 relative">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 h-full overflow-hidden">
          <iframe
            src={getChatUrl()}
            className="w-full h-full border-0 rounded-xl"
            title={`${channelName} Twitch Chat`}
            allow="autoplay"
          />
          
          {/* Highlight Indicator Overlay */}
          {settings.showHighlightOverlay && highlightedMessages.length > 0 && (
            <div className={`absolute ${
              settings.overlayPosition === 'top-left' ? 'top-4 left-4' :
              settings.overlayPosition === 'top-right' ? 'top-4 right-4' :
              settings.overlayPosition === 'bottom-left' ? 'bottom-4 left-4' :
              'bottom-4 right-4'
            } space-y-2 pointer-events-none z-10`}>
              {highlightedMessages.slice(0, 3).map((msg) => (
                <div
                  key={msg.id}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-2 rounded-lg shadow-lg animate-pulse max-w-xs"
                >
                  <div className="font-bold text-sm" style={{ color: msg.color }}>
                    {msg.displayName}
                  </div>
                  <div className="text-xs truncate">
                    {msg.message}
                  </div>
                </div>
              ))}
              {highlightedMessages.length > 3 && (
                <div className="text-yellow-400 text-xs text-center">
                  +{highlightedMessages.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center">
          <p className="text-gray-400 text-sm">
            Click any message in chat to highlight it for your OBS overlay
          </p>
          <p className="text-gray-300 text-xs mt-1">
            OBS Browser Source URL: <code className="bg-black/20 px-2 py-1 rounded">{typeof window !== 'undefined' ? `${window.location.origin}/chat-overlay` : '/chat-overlay'}</code>
          </p>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-white/20 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Chat Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-white hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Theme Selection */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Theme</label>
                <select 
                  value={settings.chatTheme}
                  onChange={(e) => setSettings(prev => ({ ...prev, chatTheme: e.target.value as 'dark' | 'light' }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              {/* Show Highlight Overlay */}
              <div className="flex items-center justify-between">
                <label className="text-white text-sm font-medium">Show Highlight Overlay</label>
                <input
                  type="checkbox"
                  checked={settings.showHighlightOverlay}
                  onChange={(e) => setSettings(prev => ({ ...prev, showHighlightOverlay: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
              </div>

              {/* Overlay Position */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Overlay Position</label>
                <select 
                  value={settings.overlayPosition}
                  onChange={(e) => setSettings(prev => ({ ...prev, overlayPosition: e.target.value as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Font Size</label>
                <input
                  type="range"
                  min="12"
                  max="20"
                  value={settings.fontSize}
                  onChange={(e) => setSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <span className="text-gray-400 text-sm">{settings.fontSize}px</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
