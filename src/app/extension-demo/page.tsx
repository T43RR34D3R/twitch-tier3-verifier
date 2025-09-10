"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HighlightedMessage {
  id: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: number;
  color: string;
  badges: string[];
  source?: string;
}

interface ChannelStats {
  channel: string;
  highlightCount: number;
  lastActivity: number;
}

export default function ExtensionDemo() {
  const [highlights, setHighlights] = useState<HighlightedMessage[]>([]);
  const [channelStats, setChannelStats] = useState<ChannelStats[]>([]);
  const [testChannel, setTestChannel] = useState('buckfoozle');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch highlights for demo channel
  useEffect(() => {
    fetchHighlights();
    fetchChannelStats();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchHighlights();
      fetchChannelStats();
    }, 5000);

    return () => clearInterval(interval);
  }, [testChannel]);

  const fetchHighlights = async () => {
    try {
      const response = await fetch(`/api/highlights/${testChannel}`);
      if (response.ok) {
        const data = await response.json();
        setHighlights(data);
      }
    } catch (error) {
      console.error('Failed to fetch highlights:', error);
    }
  };

  const fetchChannelStats = async () => {
    try {
      const response = await fetch('/api/highlights/stats', {
        method: 'OPTIONS'
      });
      if (response.ok) {
        const data = await response.json();
        setChannelStats(data.channels || []);
      }
    } catch (error) {
      console.error('Failed to fetch channel stats:', error);
    }
  };

  const addTestHighlight = async () => {
    setIsLoading(true);
    try {
      const testMessage = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: 'testuser',
        displayName: 'TestUser',
        message: `Test highlight message at ${new Date().toLocaleTimeString()}`,
        timestamp: Date.now(),
        color: '#FF6B6B',
        badges: ['subscriber', 'vip'],
        source: 'demo'
      };

      const response = await fetch(`/api/highlights/${testChannel}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMessage)
      });

      if (response.ok) {
        await fetchHighlights();
      }
    } catch (error) {
      console.error('Failed to add test highlight:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHighlights = async () => {
    setIsLoading(true);
    try {
      await fetch(`/api/highlights/${testChannel}`, {
        method: 'DELETE'
      });
      await fetchHighlights();
    } catch (error) {
      console.error('Failed to clear highlights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎯 Browser Extension Demo
          </h1>
          <p className="text-gray-300 text-lg">
            Test the integration between the browser extension and your web app
          </p>
        </div>

        {/* Extension Status */}
        <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">📋 Extension Setup</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">1. Install Extension</h3>
              <p className="text-gray-300 mb-2">Load the unpacked extension in Chrome:</p>
              <code className="block bg-gray-800 text-green-400 p-2 rounded text-sm">
                chrome://extensions/ → Load unpacked → Select browser-extension folder
              </code>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">2. Configure Extension</h3>
              <p className="text-gray-300 mb-2">Set up the extension popup with:</p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Server URL: {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}</li>
                <li>• Channel: {testChannel}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">🧪 Test Controls</h2>
          <div className="flex items-center space-x-4 mb-4">
            <input
              type="text"
              value={testChannel}
              onChange={(e) => setTestChannel(e.target.value)}
              placeholder="Channel name"
              className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400"
            />
            <button
              onClick={addTestHighlight}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded transition-colors"
            >
              {isLoading ? 'Adding...' : 'Add Test Highlight'}
            </button>
            <button
              onClick={clearHighlights}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Current Highlights */}
        <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            ⭐ Current Highlights ({highlights.length})
          </h2>
          {highlights.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">No highlights yet</div>
              <p className="text-sm text-gray-500">
                Use the browser extension on Twitch or add a test highlight above
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className="font-bold"
                        style={{ color: highlight.color }}
                      >
                        {highlight.displayName}
                      </span>
                      {highlight.badges.map((badge) => (
                        <span
                          key={badge}
                          className="bg-purple-600 text-xs px-2 py-1 rounded"
                        >
                          {badge}
                        </span>
                      ))}
                      {highlight.source && (
                        <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                          {highlight.source}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(highlight.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-white">{highlight.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Channel Statistics */}
        {channelStats.length > 0 && (
          <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">📊 Channel Statistics</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {channelStats.map((stat) => (
                <div key={stat.channel} className="bg-white/5 rounded-lg p-4">
                  <div className="font-bold text-lg text-purple-400">
                    {stat.channel}
                  </div>
                  <div className="text-sm text-gray-300">
                    {stat.highlightCount} highlights
                  </div>
                  <div className="text-xs text-gray-400">
                    Last: {stat.lastActivity > 0 
                      ? new Date(stat.lastActivity).toLocaleString()
                      : 'Never'
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">🔗 Quick Links</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href={`/chat-overlay-v2?channel=${testChannel}`}
              target="_blank"
              className="bg-purple-600 hover:bg-purple-700 text-white text-center py-3 px-4 rounded transition-colors"
            >
              📺 Overlay (V2)
            </Link>
            <Link
              href="/chat-overlay"
              target="_blank"
              className="bg-blue-600 hover:bg-blue-700 text-white text-center py-3 px-4 rounded transition-colors"
            >
              📺 Original Overlay
            </Link>
            <Link
              href="/twitch-chat"
              target="_blank"
              className="bg-green-600 hover:bg-green-700 text-white text-center py-3 px-4 rounded transition-colors"
            >
              💬 Twitch Chat Page
            </Link>
            <a
              href={`https://www.twitch.tv/${testChannel}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-violet-600 hover:bg-violet-700 text-white text-center py-3 px-4 rounded transition-colors"
            >
              🎮 Twitch Channel
            </a>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            <p className="mb-2">💡 <strong>Pro Tips:</strong></p>
            <ul className="space-y-1 ml-4">
              <li>• Use the V2 overlay with ?channel=channelname for specific channels</li>
              <li>• The extension automatically detects the channel from Twitch URLs</li>
              <li>• Highlights sync between the extension and web interface</li>
              <li>• Use the overlay as a browser source in OBS</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
