"use client";
import '../../lib/chartConfig';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Line } from 'react-chartjs-2';
import { timeChartOptions } from '@/lib/chartConfig';
import StatsNavigation from '@/components/StatsNavigation';

const SummaryPage = () => {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const fetcher = (url: string) => fetch(url).then(res => res.json());
  const { data, error } = useSWR(
    dateRange.startDate && dateRange.endDate 
      ? `/api/twitchtracker-stats?type=summary&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`
      : null,
    fetcher
  );
  const [selectedStats, setSelectedStats] = useState({ followers: true, subs: true, viewers: true });

  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 30);
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="bg-white rounded-xl shadow-2xl p-8 relative z-10">
          <div className="text-xl text-red-600">Error loading summary stats</div>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="bg-white rounded-xl shadow-2xl p-8 relative z-10">
          <div className="text-xl text-black">Loading summary stats...</div>
        </div>
      </div>
    );
  }

  const datasets = [];
  if (selectedStats.followers) {
    datasets.push({
      label: 'Total Followers',
      data: data.data.channel.map((item: { total_followers: number }) => item.total_followers),
      borderColor: 'rgba(147, 51, 234, 1)',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      fill: false,
      tension: 0.1,
    });
  }
  if (selectedStats.subs) {
    datasets.push({
      label: 'Active Subs',
      data: data.data.channel.map((item: { current_active_subs: number }) => item.current_active_subs),
      borderColor: 'rgba(59, 130, 246, 1)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: false,
      tension: 0.1,
    });
  }
  if (selectedStats.viewers) {
    datasets.push({
      label: 'Avg Viewers 30 Days',
      data: data.data.channel.map((item: { avg_viewers_30_days: number }) => item.avg_viewers_30_days),
      borderColor: 'rgba(16, 185, 129, 1)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: false,
      tension: 0.1,
    });
  }

  const chartData = {
    labels: data.data.channel.map((item: { data_date: string }) => item.data_date),
    datasets: datasets,
  };

  // Calculate summary stats
  const latestData = data.data.channel[data.data.channel.length - 1] || {};
  const firstData = data.data.channel[0] || {};
  const followerGrowth = latestData.total_followers - firstData.total_followers;
  const subGrowth = latestData.current_active_subs - firstData.current_active_subs;
  const viewerChange = latestData.avg_viewers_30_days - firstData.avg_viewers_30_days;

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat p-4" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-black">TwitchTracker Summary Analytics</h1>
            <div className="flex gap-4">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <StatsNavigation />
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-purple-700">{latestData.total_followers?.toLocaleString() || 0}</div>
              <div className="text-purple-600">Current Followers</div>
              <div className="text-sm text-gray-600">
                {followerGrowth >= 0 ? '+' : ''}{followerGrowth?.toLocaleString() || 0} in period
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-blue-700">{latestData.current_active_subs?.toLocaleString() || 0}</div>
              <div className="text-blue-600">Active Subscribers</div>
              <div className="text-sm text-gray-600">
                {subGrowth >= 0 ? '+' : ''}{subGrowth?.toLocaleString() || 0} in period
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-green-700">{latestData.avg_viewers_30_days?.toLocaleString() || 0}</div>
              <div className="text-green-600">Avg Viewers (30d)</div>
              <div className="text-sm text-gray-600">
                {viewerChange >= 0 ? '+' : ''}{viewerChange?.toLocaleString() || 0} change
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-yellow-700">{latestData.twitch_rank?.toLocaleString() || 'N/A'}</div>
              <div className="text-yellow-600">Twitch Rank</div>
              <div className="text-sm text-gray-600">Top {latestData.top_percentage || 'N/A'}</div>
            </div>
          </div>
          
          {/* Chart Controls */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Chart Options</h3>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStats.followers}
                  onChange={() => setSelectedStats(prev => ({ ...prev, followers: !prev.followers }))}
                  className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                />
                <span className="text-gray-700 font-medium">📈 Followers</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStats.subs}
                  onChange={() => setSelectedStats(prev => ({ ...prev, subs: !prev.subs }))}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="text-gray-700 font-medium">👥 Subscribers</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStats.viewers}
                  onChange={() => setSelectedStats(prev => ({ ...prev, viewers: !prev.viewers }))}
                  className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                />
                <span className="text-gray-700 font-medium">👁️ Viewers</span>
              </label>
            </div>
          </div>
          
          {/* Chart */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Growth Trends Over Time</h2>
            <div style={{ height: '400px' }}>
              <Line data={chartData} options={timeChartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;
