"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ChatAnalyticsDashboard from '@/components/ChatAnalyticsDashboard';

interface ChatStats {
  messageCount: number;
  uniqueUsers: Set<string>;
  emoteCount: number;
  averageMessageLength: number;
  chatActivity: Array<{ time: number; count: number }>;
  popularWords: Map<string, number>;
}

// ChatUser interface for future use
// interface ChatUser { ... }

interface ChatSettings {
  showStats: boolean;
  highlightKeywords: string[];
  filterBadges: string[];
  chatTheme: 'dark' | 'light' | 'purple';
  showTimestamps: boolean;
  fontSize: number;
  autoScroll: boolean;
  soundAlerts: boolean;
  keywordNotifications: boolean;
}

export default function TwitchChatPage() {
  // const { data: session } = useSession(); // Future use for user-specific features
  const [chatStats, setChatStats] = useState<ChatStats>({
    messageCount: 0,
    uniqueUsers: new Set(),
    emoteCount: 0,
    averageMessageLength: 0,
    chatActivity: [],
    popularWords: new Map()
  });
  // const [activeUsers, setActiveUsers] = useState<ChatUser[]>([]); // Future use
  const [settings, setSettings] = useState<ChatSettings>({
    showStats: true,
    highlightKeywords: ['buckfoozle', 't3', 'tier3'],
    filterBadges: [],
    chatTheme: 'dark',
    showTimestamps: true,
    fontSize: 14,
    autoScroll: true,
    soundAlerts: false,
    keywordNotifications: true
  });
  // const [isFullscreen, setIsFullscreen] = useState(false); // Future use
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [channelName, setChannelName] = useState('buckfoozle');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  // const statsRef = useRef<HTMLDivElement>(null); // Future use

  // Simulate chat activity (in real implementation, this would connect to Twitch IRC or API)
  useEffect(() => {
    const interval = setInterval(() => {
      // Update chat stats with simulated data
      setChatStats(prev => {
        const newMessageCount = prev.messageCount + Math.floor(Math.random() * 3);
        const newActivity = [...prev.chatActivity, {
          time: Date.now(),
          count: Math.floor(Math.random() * 5)
        }].slice(-20); // Keep last 20 data points

        return {
          ...prev,
          messageCount: newMessageCount,
          chatActivity: newActivity
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      // setIsFullscreen(true); // Future use
    } else {
      document.exitFullscreen();
      // setIsFullscreen(false); // Future use
    }
  };

  const exportChatStats = () => {
    const statsData = {
      timestamp: new Date().toISOString(),
      messageCount: chatStats.messageCount,
      uniqueUsers: Array.from(chatStats.uniqueUsers),
      emoteCount: chatStats.emoteCount,
      averageMessageLength: chatStats.averageMessageLength,
      popularWords: Object.fromEntries(chatStats.popularWords)
    };
    
    const blob = new Blob([JSON.stringify(statsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twitch-chat-stats-${channelName}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetStats = () => {
    setChatStats({
      messageCount: 0,
      uniqueUsers: new Set(),
      emoteCount: 0,
      averageMessageLength: 0,
      chatActivity: [],
      popularWords: new Map()
    });
  };

  return (
    <div className={`min-h-screen ${settings.chatTheme === 'dark' ? 'bg-gray-900' : settings.chatTheme === 'light' ? 'bg-white' : 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900'}`}>
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-white hover:text-purple-300 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-white">Enhanced Twitch Chat</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">Live</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Channel name..."
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 text-sm"
              />
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`p-2 text-white hover:bg-white/10 rounded transition-colors ${
                  showAnalytics ? 'bg-white/20' : ''
                }`}
                title="Analytics Dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {showAnalytics ? (
          <ChatAnalyticsDashboard 
            channel={channelName}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        ) : (
          <div className={`grid gap-6 ${settings.showStats ? 'lg:grid-cols-4' : 'lg:grid-cols-1'}`}>
          
          {/* Main Chat Area */}
          <div className={`${settings.showStats ? 'lg:col-span-3' : 'lg:col-span-1'} bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden`}>
            <div className="p-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Chat - {channelName}</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <span>Messages: {chatStats.messageCount}</span>
                  <span>•</span>
                  <span>Users: {chatStats.uniqueUsers.size}</span>
                </div>
              </div>
            </div>
            
            {/* Twitch Chat Embed */}
            <div className="relative">
              <iframe
                src={`https://www.twitch.tv/embed/${channelName}/chat?parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}&darkpopout`}
                height="600"
                width="100%"
                className="w-full border-0"
                title={`${channelName} Twitch Chat`}
              ></iframe>
              
              {/* Chat Overlay Features */}
              <div className="absolute top-2 right-2 space-y-2">
                {settings.keywordNotifications && (
                  <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs">
                    Keywords Active
                  </div>
                )}
                {settings.soundAlerts && (
                  <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                    🔊 Alerts On
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Sidebar */}
          {settings.showStats && (
            <div className="space-y-6">
              
              {/* Live Stats */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Live Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Messages</span>
                    <span className="text-white font-semibold">{chatStats.messageCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Active Users</span>
                    <span className="text-white font-semibold">{chatStats.uniqueUsers.size}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Emotes Used</span>
                    <span className="text-white font-semibold">{chatStats.emoteCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Avg Length</span>
                    <span className="text-white font-semibold">{chatStats.averageMessageLength.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Chat Activity Graph */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Activity</h3>
                <div className="h-32 flex items-end space-x-1">
                  {chatStats.chatActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="bg-purple-500 min-w-[8px] rounded-t"
                      style={{ 
                        height: `${Math.max(4, (activity.count / 5) * 100)}%`,
                        opacity: 0.7 + (index / chatStats.chatActivity.length) * 0.3
                      }}
                    ></div>
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-2">Messages per minute</div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={exportChatStats}
                    className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                  >
                    📊 Export Stats
                  </button>
                  <button
                    onClick={resetStats}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                  >
                    🔄 Reset Stats
                  </button>
                  <Link href="/analytics" className="block">
                    <button className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors">
                      📈 Full Analytics
                    </button>
                  </Link>
                </div>
              </div>

              {/* Popular Keywords */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Trending Words</h3>
                <div className="space-y-2">
                  {Array.from(chatStats.popularWords.entries())
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([word, count]) => (
                    <div key={word} className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">#{word}</span>
                      <span className="text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-white/20 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
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
                  onChange={(e) => setSettings(prev => ({ ...prev, chatTheme: e.target.value as 'dark' | 'light' | 'purple' }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="purple">Purple</option>
                </select>
              </div>

              {/* Show Statistics */}
              <div className="flex items-center justify-between">
                <label className="text-white text-sm font-medium">Show Statistics</label>
                <input
                  type="checkbox"
                  checked={settings.showStats}
                  onChange={(e) => setSettings(prev => ({ ...prev, showStats: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
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

              {/* Keyword Highlights */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Highlight Keywords</label>
                <textarea
                  value={settings.highlightKeywords.join(', ')}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    highlightKeywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                  }))}
                  placeholder="keyword1, keyword2, keyword3"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400"
                  rows={3}
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-white text-sm font-medium">Show Timestamps</label>
                  <input
                    type="checkbox"
                    checked={settings.showTimestamps}
                    onChange={(e) => setSettings(prev => ({ ...prev, showTimestamps: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-white text-sm font-medium">Auto Scroll</label>
                  <input
                    type="checkbox"
                    checked={settings.autoScroll}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoScroll: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-white text-sm font-medium">Sound Alerts</label>
                  <input
                    type="checkbox"
                    checked={settings.soundAlerts}
                    onChange={(e) => setSettings(prev => ({ ...prev, soundAlerts: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-white text-sm font-medium">Keyword Notifications</label>
                  <input
                    type="checkbox"
                    checked={settings.keywordNotifications}
                    onChange={(e) => setSettings(prev => ({ ...prev, keywordNotifications: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
