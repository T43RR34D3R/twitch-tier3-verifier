"use client";
// Analytics dashboard with comprehensive charts

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement
);

interface AnalyticsSummary {
  latest: {
    follower_count: number;
    subscriber_count: number;
    tier1_subs: number;
    tier2_subs: number;
    tier3_subs: number;
  } | null;
  totalStreamsLast30Days: number;
  totalStreamsLast7Days: number;
  avgViewersLast30Days: number;
  peakViewersLast30Days: number;
  totalBitsLast30Days: number;
  totalStreamTimeLast30Days: number;
}

interface GrowthData {
  followerGrowth: number;
  subscriberGrowth: number;
  tier3Growth: number;
  followerGrowthPercentage: string;
  subscriberGrowthPercentage: string;
}

interface SubStats {
  newSubs: number;
  reSubs: number;
  gifts: number;
  tier1: number;
  tier2: number;
  tier3: number;
  total: number;
}

interface Subscriber {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  tier: '1000' | '2000' | '3000';
  subscribed_at: string;
  is_gift: boolean;
  gifter_id?: string;
  gifter_username?: string;
  gifter_display_name?: string;
  months_total: number;
  months_streak: number;
  cumulative_months: number;
}

interface SubscriberData {
  subscribers: Subscriber[];
  total: number;
  tier1_count: number;
  tier2_count: number;
  tier3_count: number;
  estimated_earnings: {
    tier1: number;
    tier2: number;
    tier3: number;
    total: number;
  };
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [streamData, setStreamData] = useState<{
    date: string;
    average_viewers: number;
    peak_viewers: number;
    follower_count: number;
    subscriber_count: number;
    total_bits: number;
  }[]>([]);
  const [growthData, setGrowthData] = useState<GrowthData | null>(null);
  const [subStats, setSubStats] = useState<SubStats | null>(null);
  const [chatData, setChatData] = useState<{
    date: string;
    total_messages: number;
    unique_chatters: number;
  }[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [subscriberData, setSubscriberData] = useState<SubscriberData | null>(null);
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const [subscriberTierFilter, setSubscriberTierFilter] = useState<'all' | '1000' | '2000' | '3000'>('all');
  const [subscriberPage, setSubscriberPage] = useState(1);
  const [subscriberSortBy, setSubscriberSortBy] = useState<'username' | 'subscribed_at' | 'tier' | 'months_total'>('subscribed_at');
  const [subscriberSortOrder, setSubscriberSortOrder] = useState<'asc' | 'desc'>('desc');
  const subscribersPerPage = 20;

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, streamRes, growthRes, subRes, chatRes, subscriberRes] = await Promise.all([
        fetch('/api/analytics?type=summary'),
        fetch(`/api/analytics?type=stream&days=${selectedPeriod}`),
        fetch('/api/analytics?type=growth'),
        fetch('/api/analytics?type=subscriptions'),
        fetch(`/api/analytics?type=chat&days=${selectedPeriod}`),
        fetch('/api/analytics?type=subscriber_list'),
      ]);

      const summaryData = await summaryRes.json();
      const streamResult = await streamRes.json();
      const growthResult = await growthRes.json();
      const subResult = await subRes.json();
      const chatResult = await chatRes.json();
      const subscriberResult = await subscriberRes.json();

      setSummary(summaryData.summary);
      setStreamData(streamResult.data || []);
      setGrowthData(growthResult.growth);
      setSubStats(subResult.stats);
      setChatData(chatResult.data || []);
      setSubscriberData(subscriberResult.data || null);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      // Don't redirect immediately, let them see the login option
      setLoading(false);
      return;
    }

    loadAnalytics();
  }, [session, status, selectedPeriod, loadAnalytics]);

  const getViewerChartData = () => {
    if (!streamData.length) return { labels: [], datasets: [] };

    return {
      labels: streamData.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Average Viewers',
          data: streamData.map(d => d.average_viewers),
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Peak Viewers',
          data: streamData.map(d => d.peak_viewers),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1,
        },
      ],
    };
  };

  const getGrowthChartData = () => {
    if (!streamData.length) return { labels: [], datasets: [] };

    return {
      labels: streamData.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Followers',
          data: streamData.map(d => d.follower_count),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Subscribers',
          data: streamData.map(d => d.subscriber_count),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
        },
      ],
    };
  };

  const getSubTierChartData = () => {
    if (!summary?.latest) return { labels: [], datasets: [] };

    return {
      labels: ['Tier 1', 'Tier 2', 'Tier 3'],
      datasets: [
        {
          data: [summary.latest.tier1_subs, summary.latest.tier2_subs, summary.latest.tier3_subs],
          backgroundColor: ['rgb(34, 197, 94)', 'rgb(59, 130, 246)', 'rgb(147, 51, 234)'],
          borderWidth: 2,
        },
      ],
    };
  };

  const getBitsChartData = () => {
    if (!streamData.length) return { labels: [], datasets: [] };

    return {
      labels: streamData.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Bits Received',
          data: streamData.map(d => d.total_bits),
          backgroundColor: 'rgba(147, 51, 234, 0.8)',
          borderColor: 'rgb(147, 51, 234)',
          borderWidth: 1,
        },
      ],
    };
  };

  const getChatChartData = () => {
    if (!chatData.length) return { labels: [], datasets: [] };

    return {
      labels: chatData.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Total Messages',
          data: chatData.map(d => d.total_messages),
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Unique Chatters',
          data: chatData.map(d => d.unique_chatters),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.1,
        },
      ],
    };
  };

  const getFilteredSubscribers = () => {
    if (!subscriberData) return [];
    
    let filtered = subscriberData.subscribers;
    
    // Apply search filter
    if (subscriberSearch) {
      const searchLower = subscriberSearch.toLowerCase();
      filtered = filtered.filter(sub => 
        sub.username.toLowerCase().includes(searchLower) ||
        sub.display_name.toLowerCase().includes(searchLower) ||
        (sub.gifter_username && sub.gifter_username.toLowerCase().includes(searchLower)) ||
        (sub.gifter_display_name && sub.gifter_display_name.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply tier filter
    if (subscriberTierFilter !== 'all') {
      filtered = filtered.filter(sub => sub.tier === subscriberTierFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (subscriberSortBy) {
        case 'username':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case 'subscribed_at':
          aValue = new Date(a.subscribed_at).getTime();
          bValue = new Date(b.subscribed_at).getTime();
          break;
        case 'tier':
          aValue = parseInt(a.tier);
          bValue = parseInt(b.tier);
          break;
        case 'months_total':
          aValue = a.months_total;
          bValue = b.months_total;
          break;
        default:
          return 0;
      }
      
      if (subscriberSortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  };

  const getPaginatedSubscribers = () => {
    const filtered = getFilteredSubscribers();
    const startIndex = (subscriberPage - 1) * subscribersPerPage;
    const endIndex = startIndex + subscribersPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(getFilteredSubscribers().length / subscribersPerPage);
  };

  const getTierDisplay = (tier: string) => {
    switch (tier) {
      case '1000': return 'Tier 1';
      case '2000': return 'Tier 2';
      case '3000': return 'Tier 3';
      default: return 'Unknown';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case '1000': return 'bg-green-100 text-green-800';
      case '2000': return 'bg-blue-100 text-blue-800';
      case '3000': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatEstimatedEarnings = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="bg-white rounded-xl shadow-2xl p-8 relative z-10">
          <div className="text-xl text-black">Loading Analytics...</div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center relative z-10">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-black mb-4">Analytics Dashboard</h1>
          <p className="text-gray-600 mb-6">Please sign in to view your stream analytics</p>
          <div className="space-y-4">
            <button
              onClick={() => router.push('/auth/signin')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
              </svg>
              <span>Sign in with Twitch</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Back to Main
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat p-4" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* Header */}
          <div className="mb-8">
            {/* User indicator */}
            <div className="flex items-center justify-between mb-4 p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <div className="font-semibold text-black">
                    {session.user?.name || "Unknown User"}
                  </div>
                  <div className="text-sm text-gray-600">
                    Analytics for {session.user?.name || "your channel"}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  ✓ Signed In
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-black">Stream Analytics Dashboard</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/analytics_test')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  View Test Data
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Back to Main
                </button>
              </div>
            </div>
            <div className="flex gap-4 mb-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-purple-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-purple-700">{summary.latest?.follower_count?.toLocaleString() || 0}</div>
                <div className="text-purple-600">Total Followers</div>
                {summary.latest?.follower_count === 0 && (
                  <div className="text-xs text-purple-500 mt-1">
                    Requires channel:read:subscriptions scope
                  </div>
                )}
                {growthData && (
                  <div className="text-sm text-purple-500 mt-1">
                    {growthData.followerGrowth >= 0 ? '+' : ''}{growthData.followerGrowth} ({growthData.followerGrowthPercentage}%) last 30 days
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-blue-700">{summary.latest?.subscriber_count?.toLocaleString() || 0}</div>
                <div className="text-blue-600">Total Subscribers</div>
                {growthData && (
                  <div className="text-sm text-blue-500 mt-1">
                    {growthData.subscriberGrowth >= 0 ? '+' : ''}{growthData.subscriberGrowth} ({growthData.subscriberGrowthPercentage}%) last 30 days
                  </div>
                )}
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-green-700">{summary.avgViewersLast30Days?.toLocaleString() || 0}</div>
                <div className="text-green-600">Avg Viewers (30d)</div>
                <div className="text-sm text-green-500 mt-1">
                  Peak: {summary.peakViewersLast30Days?.toLocaleString() || 0}
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-yellow-700">{summary.totalStreamTimeLast30Days?.toLocaleString() || 0}h</div>
                <div className="text-yellow-600">Stream Time (30d)</div>
                <div className="text-sm text-yellow-500 mt-1">
                  {summary.totalStreamsLast30Days || 0} streams
                </div>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Viewer Analytics */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-black mb-4">Viewer Analytics</h2>
              <div className="h-64">
                <Line data={getViewerChartData()} options={{responsive: true, maintainAspectRatio: false}} />
              </div>
            </div>

            {/* Growth Analytics */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-black mb-4">Growth Analytics</h2>
              <div className="h-64">
                <Line data={getGrowthChartData()} options={{responsive: true, maintainAspectRatio: false}} />
              </div>
            </div>

            {/* Subscription Tiers */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-black mb-4">Subscription Tiers</h2>
              <div className="h-64">
                <Doughnut data={getSubTierChartData()} options={{responsive: true, maintainAspectRatio: false}} />
              </div>
            </div>

            {/* Bits Analytics */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-black mb-4">Bits Analytics</h2>
              <div className="h-64">
                <Bar data={getBitsChartData()} options={{responsive: true, maintainAspectRatio: false}} />
              </div>
            </div>

            {/* Chat Analytics */}
            <div className="bg-gray-50 rounded-lg p-6 lg:col-span-2">
              <h2 className="text-xl font-bold text-black mb-4">Chat Analytics</h2>
              <div className="h-64">
                <Line data={getChatChartData()} options={{responsive: true, maintainAspectRatio: false}} />
              </div>
            </div>
          </div>

          {/* Subscription Stats */}
          {subStats && (
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-black mb-4">Subscription Activity (Last 30 Days)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{subStats.newSubs}</div>
                  <div className="text-sm text-gray-600">New Subs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{subStats.reSubs}</div>
                  <div className="text-sm text-gray-600">Re-subs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{subStats.gifts}</div>
                  <div className="text-sm text-gray-600">Gifts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{subStats.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{subStats.tier1}</div>
                  <div className="text-sm text-gray-600">Tier 1</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{subStats.tier2}</div>
                  <div className="text-sm text-gray-600">Tier 2</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{subStats.tier3}</div>
                  <div className="text-sm text-gray-600">Tier 3</div>
                </div>
              </div>
            </div>
          )}

          {/* Subscriber Management */}
          {subscriberData && (
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <h2 className="text-xl font-bold text-black mb-4 lg:mb-0">Subscriber Management</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Search:</span>
                    <input
                      type="text"
                      value={subscriberSearch}
                      onChange={(e) => {
                        setSubscriberSearch(e.target.value);
                        setSubscriberPage(1);
                      }}
                      placeholder="Username or gifter..."
                      className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Tier:</span>
                    <select
                      value={subscriberTierFilter}
                      onChange={(e) => {
                        setSubscriberTierFilter(e.target.value as 'all' | '1000' | '2000' | '3000');
                        setSubscriberPage(1);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="all">All Tiers</option>
                      <option value="1000">Tier 1</option>
                      <option value="2000">Tier 2</option>
                      <option value="3000">Tier 3</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Sort by:</span>
                    <select
                      value={subscriberSortBy}
                      onChange={(e) => setSubscriberSortBy(e.target.value as 'username' | 'subscribed_at' | 'tier' | 'months_total')}
                      className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="subscribed_at">Subscribe Date</option>
                      <option value="username">Username</option>
                      <option value="tier">Tier</option>
                      <option value="months_total">Total Months</option>
                    </select>
                    <button
                      onClick={() => setSubscriberSortOrder(subscriberSortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-2 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                    >
                      {subscriberSortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Earnings Summary */}
              {subscriberData.estimated_earnings && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatEstimatedEarnings(subscriberData.estimated_earnings.tier1)}
                    </div>
                    <div className="text-sm text-gray-600">Tier 1 Earnings</div>
                    <div className="text-xs text-gray-500">{subscriberData.tier1_count} subscribers</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatEstimatedEarnings(subscriberData.estimated_earnings.tier2)}
                    </div>
                    <div className="text-sm text-gray-600">Tier 2 Earnings</div>
                    <div className="text-xs text-gray-500">{subscriberData.tier2_count} subscribers</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatEstimatedEarnings(subscriberData.estimated_earnings.tier3)}
                    </div>
                    <div className="text-sm text-gray-600">Tier 3 Earnings</div>
                    <div className="text-xs text-gray-500">{subscriberData.tier3_count} subscribers</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {formatEstimatedEarnings(subscriberData.estimated_earnings.total)}
                    </div>
                    <div className="text-sm text-gray-600">Total Earnings</div>
                    <div className="text-xs text-gray-500">{subscriberData.total} subscribers</div>
                  </div>
                </div>
              )}

              {/* Subscriber List */}
              <div className="bg-white rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Username
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Tier
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Subscribe Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Months
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Gifter
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getPaginatedSubscribers().map((subscriber) => (
                        <tr key={subscriber.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {subscriber.display_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  @{subscriber.username}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(subscriber.tier)}`}>
                              {getTierDisplay(subscriber.tier)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(subscriber.subscribed_at)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex flex-col">
                              <span>Total: {subscriber.months_total}</span>
                              <span className="text-xs text-gray-500">Streak: {subscriber.months_streak}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              subscriber.is_gift ? 'bg-pink-100 text-pink-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {subscriber.is_gift ? 'Gift' : 'Direct'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subscriber.is_gift && subscriber.gifter_display_name ? (
                              <div>
                                <div className="text-sm font-medium">
                                  {subscriber.gifter_display_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  @{subscriber.gifter_username}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {getTotalPages() > 1 && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {Math.min((subscriberPage - 1) * subscribersPerPage + 1, getFilteredSubscribers().length)} to{' '}
                      {Math.min(subscriberPage * subscribersPerPage, getFilteredSubscribers().length)} of{' '}
                      {getFilteredSubscribers().length} subscribers
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSubscriberPage(Math.max(1, subscriberPage - 1))}
                        disabled={subscriberPage === 1}
                        className="px-3 py-1 bg-white border border-gray-300 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {subscriberPage} of {getTotalPages()}
                      </span>
                      <button
                        onClick={() => setSubscriberPage(Math.min(getTotalPages(), subscriberPage + 1))}
                        disabled={subscriberPage === getTotalPages()}
                        className="px-3 py-1 bg-white border border-gray-300 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

