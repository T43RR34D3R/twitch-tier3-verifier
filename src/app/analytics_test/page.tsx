"use client";
// Analytics test page with test broadcaster data

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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

// Mock test data for demonstration
const mockSummary = {
  latest: {
    follower_count: 16195,
    subscriber_count: 329,
    tier1_subs: 258,
    tier2_subs: 51,
    tier3_subs: 20,
  },
  totalStreamsLast30Days: 22,
  totalStreamsLast7Days: 5,
  avgViewersLast30Days: 1050,
  peakViewersLast30Days: 1750,
  totalBitsLast30Days: 45600,
  totalStreamTimeLast30Days: 156,
};

const mockStreamData = [
  { date: '2024-12-12', average_viewers: 880, peak_viewers: 1250, follower_count: 15420, subscriber_count: 245, total_bits: 12500 },
  { date: '2024-12-13', average_viewers: 920, peak_viewers: 1450, follower_count: 15450, subscriber_count: 248, total_bits: 15600 },
  { date: '2024-12-14', average_viewers: 0, peak_viewers: 0, follower_count: 15450, subscriber_count: 248, total_bits: 0 },
  { date: '2024-12-15', average_viewers: 1100, peak_viewers: 1650, follower_count: 15485, subscriber_count: 252, total_bits: 18900 },
  { date: '2024-12-16', average_viewers: 850, peak_viewers: 1200, follower_count: 15510, subscriber_count: 255, total_bits: 11200 },
  { date: '2024-12-17', average_viewers: 780, peak_viewers: 1100, follower_count: 15535, subscriber_count: 258, total_bits: 9800 },
  { date: '2024-12-18', average_viewers: 1050, peak_viewers: 1580, follower_count: 15580, subscriber_count: 262, total_bits: 16700 },
  { date: '2024-12-19', average_viewers: 0, peak_viewers: 0, follower_count: 15580, subscriber_count: 262, total_bits: 0 },
  { date: '2024-12-20', average_viewers: 950, peak_viewers: 1350, follower_count: 15620, subscriber_count: 265, total_bits: 13400 },
  { date: '2024-12-21', average_viewers: 1200, peak_viewers: 1750, follower_count: 15665, subscriber_count: 270, total_bits: 21200 },
  { date: '2024-12-22', average_viewers: 750, peak_viewers: 1050, follower_count: 15690, subscriber_count: 273, total_bits: 8900 },
  { date: '2024-12-23', average_viewers: 1020, peak_viewers: 1480, follower_count: 15725, subscriber_count: 276, total_bits: 17800 },
  { date: '2024-12-24', average_viewers: 0, peak_viewers: 0, follower_count: 15725, subscriber_count: 276, total_bits: 0 },
  { date: '2024-12-25', average_viewers: 1080, peak_viewers: 1620, follower_count: 15770, subscriber_count: 280, total_bits: 19500 },
  { date: '2024-12-26', average_viewers: 820, peak_viewers: 1180, follower_count: 15795, subscriber_count: 283, total_bits: 10600 },
  { date: '2024-12-27', average_viewers: 980, peak_viewers: 1400, follower_count: 15830, subscriber_count: 287, total_bits: 14900 },
  { date: '2024-12-28', average_viewers: 800, peak_viewers: 1120, follower_count: 15850, subscriber_count: 290, total_bits: 9200 },
  { date: '2024-12-29', average_viewers: 0, peak_viewers: 0, follower_count: 15850, subscriber_count: 290, total_bits: 0 },
  { date: '2024-12-30', average_viewers: 1040, peak_viewers: 1520, follower_count: 15890, subscriber_count: 294, total_bits: 16800 },
  { date: '2024-12-31', average_viewers: 770, peak_viewers: 1080, follower_count: 15915, subscriber_count: 297, total_bits: 8700 },
  { date: '2025-01-01', average_viewers: 1150, peak_viewers: 1650, follower_count: 15960, subscriber_count: 302, total_bits: 18900 },
  { date: '2025-01-02', average_viewers: 900, peak_viewers: 1280, follower_count: 15985, subscriber_count: 305, total_bits: 12100 },
  { date: '2025-01-03', average_viewers: 0, peak_viewers: 0, follower_count: 15985, subscriber_count: 305, total_bits: 0 },
  { date: '2025-01-04', average_viewers: 990, peak_viewers: 1420, follower_count: 16025, subscriber_count: 309, total_bits: 15200 },
  { date: '2025-01-05', average_viewers: 1220, peak_viewers: 1720, follower_count: 16070, subscriber_count: 314, total_bits: 20800 },
  { date: '2025-01-06', average_viewers: 730, peak_viewers: 1020, follower_count: 16090, subscriber_count: 317, total_bits: 8200 },
  { date: '2025-01-07', average_viewers: 1050, peak_viewers: 1500, follower_count: 16125, subscriber_count: 321, total_bits: 17300 },
  { date: '2025-01-08', average_viewers: 0, peak_viewers: 0, follower_count: 16125, subscriber_count: 321, total_bits: 0 },
  { date: '2025-01-09', average_viewers: 1120, peak_viewers: 1600, follower_count: 16170, subscriber_count: 326, total_bits: 19200 },
  { date: '2025-01-10', average_viewers: 880, peak_viewers: 1250, follower_count: 16195, subscriber_count: 329, total_bits: 11800 },
];

const mockGrowthData = {
  followerGrowth: 775,
  subscriberGrowth: 84,
  tier3Growth: 5,
  followerGrowthPercentage: "5.0",
  subscriberGrowthPercentage: "34.3",
};

const mockSubStats = {
  newSubs: 45,
  reSubs: 39,
  gifts: 12,
  tier1: 67,
  tier2: 14,
  tier3: 3,
  total: 84,
};

const mockChatData = [
  { date: '2024-12-12', total_messages: 3450, unique_chatters: 125 },
  { date: '2024-12-13', total_messages: 4200, unique_chatters: 145 },
  { date: '2024-12-14', total_messages: 0, unique_chatters: 0 },
  { date: '2024-12-15', total_messages: 5100, unique_chatters: 165 },
  { date: '2024-12-16', total_messages: 3200, unique_chatters: 110 },
  { date: '2024-12-17', total_messages: 2900, unique_chatters: 98 },
  { date: '2024-12-18', total_messages: 4800, unique_chatters: 155 },
  { date: '2024-12-19', total_messages: 0, unique_chatters: 0 },
  { date: '2024-12-20', total_messages: 3800, unique_chatters: 132 },
  { date: '2024-12-21', total_messages: 5600, unique_chatters: 185 },
  { date: '2024-12-22', total_messages: 2600, unique_chatters: 92 },
  { date: '2024-12-23', total_messages: 4900, unique_chatters: 170 },
  { date: '2024-12-24', total_messages: 0, unique_chatters: 0 },
  { date: '2024-12-25', total_messages: 5300, unique_chatters: 178 },
  { date: '2024-12-26', total_messages: 3100, unique_chatters: 105 },
  { date: '2024-12-27', total_messages: 4200, unique_chatters: 148 },
  { date: '2024-12-28', total_messages: 2800, unique_chatters: 95 },
  { date: '2024-12-29', total_messages: 0, unique_chatters: 0 },
  { date: '2024-12-30', total_messages: 4700, unique_chatters: 162 },
  { date: '2024-12-31', total_messages: 2500, unique_chatters: 88 },
  { date: '2025-01-01', total_messages: 5200, unique_chatters: 175 },
  { date: '2025-01-02', total_messages: 3600, unique_chatters: 125 },
  { date: '2025-01-03', total_messages: 0, unique_chatters: 0 },
  { date: '2025-01-04', total_messages: 4300, unique_chatters: 152 },
  { date: '2025-01-05', total_messages: 5800, unique_chatters: 195 },
  { date: '2025-01-06', total_messages: 2400, unique_chatters: 82 },
  { date: '2025-01-07', total_messages: 4800, unique_chatters: 165 },
  { date: '2025-01-08', total_messages: 0, unique_chatters: 0 },
  { date: '2025-01-09', total_messages: 5400, unique_chatters: 182 },
  { date: '2025-01-10', total_messages: 3400, unique_chatters: 118 },
];

export default function AnalyticsTestPage() {
  useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getViewerChartData = () => {
    return {
      labels: mockStreamData.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Average Viewers',
          data: mockStreamData.map(d => d.average_viewers),
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Peak Viewers',
          data: mockStreamData.map(d => d.peak_viewers),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1,
        },
      ],
    };
  };

  const getGrowthChartData = () => {
    return {
      labels: mockStreamData.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Followers',
          data: mockStreamData.map(d => d.follower_count),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Subscribers',
          data: mockStreamData.map(d => d.subscriber_count),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
        },
      ],
    };
  };

  const getSubTierChartData = () => {
    return {
      labels: ['Tier 1', 'Tier 2', 'Tier 3'],
      datasets: [
        {
          data: [mockSummary.latest.tier1_subs, mockSummary.latest.tier2_subs, mockSummary.latest.tier3_subs],
          backgroundColor: ['rgb(34, 197, 94)', 'rgb(59, 130, 246)', 'rgb(147, 51, 234)'],
          borderWidth: 2,
        },
      ],
    };
  };

  const getBitsChartData = () => {
    return {
      labels: mockStreamData.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Bits Received',
          data: mockStreamData.map(d => d.total_bits),
          backgroundColor: 'rgba(147, 51, 234, 0.8)',
          borderColor: 'rgb(147, 51, 234)',
          borderWidth: 1,
        },
      ],
    };
  };

  const getChatChartData = () => {
    return {
      labels: mockChatData.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Total Messages',
          data: mockChatData.map(d => d.total_messages),
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Unique Chatters',
          data: mockChatData.map(d => d.unique_chatters),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.1,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="bg-white rounded-xl shadow-2xl p-8 relative z-10">
          <div className="text-xl text-black">Loading Test Analytics...</div>
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
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-black">Test Analytics Dashboard</h1>
                <p className="text-gray-600 mt-2">Demo data from &quot;Test Streamer&quot; - Example affiliate channel</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/analytics')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Real Analytics
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Back to Main
                </button>
              </div>
            </div>
            
            {/* Test Data Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-blue-800 font-semibold">Test Analytics Data</h3>
                  <p className="text-blue-700 text-sm">This page shows sample analytics data for demonstration purposes. All data is fictional and represents what an affiliate streamer&apos;s analytics might look like.</p>
                </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-purple-700">{mockSummary.latest.follower_count.toLocaleString()}</div>
              <div className="text-purple-600">Total Followers</div>
              <div className="text-sm text-purple-500 mt-1">
                +{mockGrowthData.followerGrowth} ({mockGrowthData.followerGrowthPercentage}%) last 30 days
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-blue-700">{mockSummary.latest.subscriber_count.toLocaleString()}</div>
              <div className="text-blue-600">Total Subscribers</div>
              <div className="text-sm text-blue-500 mt-1">
                +{mockGrowthData.subscriberGrowth} ({mockGrowthData.subscriberGrowthPercentage}%) last 30 days
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-green-700">{mockSummary.avgViewersLast30Days.toLocaleString()}</div>
              <div className="text-green-600">Avg Viewers (30d)</div>
              <div className="text-sm text-green-500 mt-1">
                Peak: {mockSummary.peakViewersLast30Days.toLocaleString()}
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-yellow-700">{mockSummary.totalStreamTimeLast30Days}h</div>
              <div className="text-yellow-600">Stream Time (30d)</div>
              <div className="text-sm text-yellow-500 mt-1">
                {mockSummary.totalStreamsLast30Days} streams
              </div>
            </div>
          </div>

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
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-black mb-4">Subscription Activity (Last 30 Days)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{mockSubStats.newSubs}</div>
                <div className="text-sm text-gray-600">New Subs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{mockSubStats.reSubs}</div>
                <div className="text-sm text-gray-600">Re-subs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{mockSubStats.gifts}</div>
                <div className="text-sm text-gray-600">Gifts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{mockSubStats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{mockSubStats.tier1}</div>
                <div className="text-sm text-gray-600">Tier 1</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{mockSubStats.tier2}</div>
                <div className="text-sm text-gray-600">Tier 2</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{mockSubStats.tier3}</div>
                <div className="text-sm text-gray-600">Tier 3</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
