"use client";
import '../../../lib/chartConfig';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Line } from 'react-chartjs-2';
import { timeChartOptions } from '@/lib/chartConfig';
import StatsNavigation from '@/components/StatsNavigation';

const DailyStatsPage = () => {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const fetcher = (url: string) => fetch(url).then(res => res.json());
  const { data, error } = useSWR(
    dateRange.startDate && dateRange.endDate 
      ? `/api/twitchtracker-stats?type=daily&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`
      : null,
    fetcher
  );

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
          <div className="text-xl text-red-600">Error loading daily stats</div>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="bg-white rounded-xl shadow-2xl p-8 relative z-10">
          <div className="text-xl text-black">Loading daily stats...</div>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.data.map((item: { data_date: string }) => item.data_date),
    datasets: [
      {
        label: 'Total Followers',
        data: data.data.map((item: { total_followers: number }) => item.total_followers),
        borderColor: 'rgba(147, 51, 234, 1)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        fill: false,
        tension: 0.1,
      },
      {
        label: 'Active Subs',
        data: data.data.map((item: { current_active_subs: number }) => item.current_active_subs),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: false,
        tension: 0.1,
      },
      {
        label: 'Avg Viewers 30 Days',
        data: data.data.map((item: { avg_viewers_30_days: number }) => item.avg_viewers_30_days),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: false,
        tension: 0.1,
      }
    ],
  };

  // Calculate summary stats from the data
  const latestData = data.data[data.data.length - 1] || {};
  const firstData = data.data[0] || {};
  const followerGrowth = latestData.total_followers - firstData.total_followers;
  const subGrowth = latestData.current_active_subs - firstData.current_active_subs;

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat p-4" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-black">TwitchTracker Daily Statistics</h1>
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
            </div>
            <div className="bg-yellow-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-yellow-700">{data.data.length}</div>
              <div className="text-yellow-600">Days Tracked</div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Growth Trends</h2>
            <div style={{ height: '400px' }}>
              <Line data={chartData} options={timeChartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyStatsPage;

