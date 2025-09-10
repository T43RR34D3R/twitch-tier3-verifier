"use client";

import { useEffect, useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChatAnalytics {
  messageCount: number;
  uniqueUsers: string[];
  emoteCount: number;
  averageMessageLength: number;
  messageRate: number;
  popularEmotes: Array<{ emote: string; count: number }>;
  popularWords: Array<{ word: string; count: number }>;
  userActivity: Array<{ username: string; messageCount: number; lastSeen: number }>;
  hourlyActivity: Array<{ hour: number; count: number }>;
  chatMood: 'positive' | 'negative' | 'neutral';
  topChatters: Array<{ username: string; messageCount: number; badges: string[] }>;
}

interface ChatAnalyticsDashboardProps {
  channel: string;
  timeRange: '1h' | '6h' | '24h' | '7d';
  onTimeRangeChange: (range: '1h' | '6h' | '24h' | '7d') => void;
}

export default function ChatAnalyticsDashboard({ 
  channel, 
  timeRange, 
  onTimeRangeChange 
}: ChatAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [channel, timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/twitch/chat-analytics?channel=${channel}&range=${timeRange}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      default: return '😐';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/20 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-3 bg-white/20 rounded"></div>
            <div className="h-3 bg-white/20 rounded w-2/3"></div>
            <div className="h-3 bg-white/20 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="text-center text-red-400">
          <p>Failed to load analytics</p>
          <p className="text-sm text-gray-400 mt-2">{error}</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Chart configurations
  const hourlyActivityChart = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [{
      label: 'Messages per Hour',
      data: analytics.hourlyActivity.map(h => h.count),
      borderColor: 'rgb(147, 51, 234)',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const popularEmotesChart = {
    labels: analytics.popularEmotes.slice(0, 5).map(e => e.emote),
    datasets: [{
      data: analytics.popularEmotes.slice(0, 5).map(e => e.count),
      backgroundColor: [
        'rgba(147, 51, 234, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)'
    }]
  };

  const topChattersChart = {
    labels: analytics.topChatters.slice(0, 8).map(c => c.username),
    datasets: [{
      label: 'Messages',
      data: analytics.topChatters.slice(0, 8).map(c => c.messageCount),
      backgroundColor: 'rgba(147, 51, 234, 0.6)',
      borderColor: 'rgba(147, 51, 234, 1)',
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#ffffff'
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#ffffff',
          padding: 20
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Chat Analytics - {channel}</h2>
        <div className="flex space-x-2">
          {(['1h', '6h', '24h', '7d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeRange === range
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold text-white">{analytics.messageCount.toLocaleString()}</div>
          <div className="text-gray-300 text-sm">Total Messages</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold text-white">{analytics.uniqueUsers.length.toLocaleString()}</div>
          <div className="text-gray-300 text-sm">Unique Users</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold text-white">{analytics.messageRate.toFixed(1)}</div>
          <div className="text-gray-300 text-sm">Msgs/Min</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="text-2xl font-bold text-white">{analytics.averageMessageLength.toFixed(1)}</div>
          <div className="text-gray-300 text-sm">Avg Length</div>
        </div>
      </div>

      {/* Chat Mood */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Chat Mood</h3>
        <div className="flex items-center space-x-4">
          <div className="text-4xl">{getMoodIcon(analytics.chatMood)}</div>
          <div>
            <div className={`text-xl font-semibold ${getMoodColor(analytics.chatMood)}`}>
              {analytics.chatMood.charAt(0).toUpperCase() + analytics.chatMood.slice(1)}
            </div>
            <div className="text-gray-300 text-sm">
              Based on message content analysis
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Hourly Activity */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Hourly Activity</h3>
          <div className="h-64">
            <Line data={hourlyActivityChart} options={chartOptions} />
          </div>
        </div>

        {/* Top Chatters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Top Chatters</h3>
          <div className="h-64">
            <Bar data={topChattersChart} options={chartOptions} />
          </div>
        </div>

        {/* Popular Emotes */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Popular Emotes</h3>
          <div className="h-64">
            <Doughnut data={popularEmotesChart} options={doughnutOptions} />
          </div>
        </div>

        {/* Popular Words */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Trending Words</h3>
          <div className="space-y-3">
            {analytics.popularWords.slice(0, 10).map((word, index) => (
              <div key={word.word} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">#{index + 1}</span>
                  <span className="text-white font-medium">{word.word}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div 
                    className="bg-purple-600 h-2 rounded"
                    style={{ width: `${(word.count / analytics.popularWords[0]?.count || 1) * 100}px` }}
                  ></div>
                  <span className="text-gray-300 text-sm w-8 text-right">{word.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Activity Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Recent User Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left text-gray-300 pb-2">Username</th>
                <th className="text-right text-gray-300 pb-2">Messages</th>
                <th className="text-right text-gray-300 pb-2">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {analytics.userActivity
                .sort((a, b) => b.lastSeen - a.lastSeen)
                .slice(0, 15)
                .map((user) => (
                <tr key={user.username} className="border-b border-white/10">
                  <td className="text-white py-2">{user.username}</td>
                  <td className="text-right text-gray-300 py-2">{user.messageCount}</td>
                  <td className="text-right text-gray-300 py-2">
                    {new Date(user.lastSeen).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
