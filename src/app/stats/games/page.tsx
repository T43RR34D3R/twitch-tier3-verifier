"use client";
import '../../../lib/chartConfig';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Bar } from 'react-chartjs-2';
import { barChartOptions } from '@/lib/chartConfig';
import StatsNavigation from '@/components/StatsNavigation';

const GameStatsPage = () => {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const fetcher = (url: string) => fetch(url).then(res => res.json());
  const { data, error } = useSWR(
    dateRange.startDate && dateRange.endDate 
      ? `/api/twitchtracker-stats?type=games&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`
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
          <div className="text-xl text-red-600">Error loading game stats</div>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="bg-white rounded-xl shadow-2xl p-8 relative z-10">
          <div className="text-xl text-black">Loading game stats...</div>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.data.map((item: { game_name: string }) => item.game_name),
    datasets: [
      {
        label: 'Total Hours Streamed',
        data: data.data.map((item: { total_hours_streamed: number }) => item.total_hours_streamed),
        backgroundColor: 'rgba(147, 51, 234, 0.7)',
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 2,
      },
      {
        label: 'Average Viewers',
        data: data.data.map((item: { avg_viewers: number }) => item.avg_viewers),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      }
    ],
  };

  // Calculate summary stats
  const totalHours = data.data.reduce((sum: number, item: { total_hours_streamed: number }) => sum + item.total_hours_streamed, 0);
  const avgViewers = data.data.reduce((sum: number, item: { avg_viewers: number }) => sum + item.avg_viewers, 0) / data.data.length;
  const topGame = data.data.reduce((max: { total_hours_streamed: number; game_name: string } | null, item: { total_hours_streamed: number; game_name: string }) => 
    item.total_hours_streamed > (max?.total_hours_streamed || 0) ? item : max, null
  );

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat p-4" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-black">TwitchTracker Game Statistics</h1>
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
              <div className="text-2xl font-bold text-purple-700">{data.data.length}</div>
              <div className="text-purple-600">Games Tracked</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-blue-700">{totalHours.toFixed(1)}h</div>
              <div className="text-blue-600">Total Hours Streamed</div>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-green-700">{Math.round(avgViewers).toLocaleString()}</div>
              <div className="text-green-600">Avg Viewers Across Games</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-yellow-700">{topGame?.game_name || 'N/A'}</div>
              <div className="text-yellow-600">Most Streamed Game</div>
              <div className="text-sm text-gray-600">{topGame?.total_hours_streamed?.toFixed(1) || 0}h</div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Game Performance Breakdown</h2>
            <div style={{ height: '500px' }}>
              <Bar data={chartData} options={barChartOptions} />
            </div>
          </div>
          
          {/* Game Details Table */}
          <div className="bg-gray-50 rounded-lg p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Game Details</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Game</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours Streamed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Viewers</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peak Viewers</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Followers Gained</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.data.map((game: { game_name: string; total_hours_streamed?: number; avg_viewers?: number; peak_viewers?: number; followers_gained?: number }, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{game.game_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{game.total_hours_streamed?.toFixed(1) || 0}h</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{game.avg_viewers?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{game.peak_viewers?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{game.followers_gained?.toLocaleString() || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameStatsPage;

