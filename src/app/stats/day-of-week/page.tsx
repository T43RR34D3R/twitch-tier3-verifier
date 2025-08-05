"use client";
import '../../../lib/chartConfig';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Bar } from 'react-chartjs-2';
import { barChartOptions } from '@/lib/chartConfig';
import StatsNavigation from '@/components/StatsNavigation';

const DayOfWeekStatsPage = () => {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const fetcher = (url: string) => fetch(url).then(res => res.json());
  const { data, error } = useSWR(
    dateRange.startDate && dateRange.endDate 
      ? `/api/twitchtracker-stats?type=day-of-week&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`
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
          <div className="text-xl text-red-600">Error loading day of week stats</div>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="bg-white rounded-xl shadow-2xl p-8 relative z-10">
          <div className="text-xl text-black">Loading day of week stats...</div>
        </div>
      </div>
    );
  }

  const chartLabels = Object.keys(data.data);
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Average Viewers',
        data: chartLabels.map(day => data.data[day].avgViewers),
        backgroundColor: 'rgba(147, 51, 234, 0.7)',
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 2,
      },
      {
        label: 'Total Duration (mins)',
        data: chartLabels.map(day => data.data[day].totalDuration),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      }
    ],
  };

  // Calculate summary stats
  interface DayStats {
    day: string;
    avgViewers: number;
    totalDuration: number;
    streamCount?: number;
  }
  
  const dayStats: DayStats[] = Object.entries(data.data).map(([day, stats]: [string, unknown]) => ({
    day,
    ...(stats as { avgViewers: number; totalDuration: number; streamCount?: number })
  }));
  
  const bestViewerDay = dayStats.reduce((max, day) => day.avgViewers > max.avgViewers ? day : max);
  const longestStreamDay = dayStats.reduce((max, day) => day.totalDuration > max.totalDuration ? day : max);
  const totalMinutes = dayStats.reduce((sum, day) => sum + day.totalDuration, 0);
  const avgViewersOverall = dayStats.reduce((sum, day) => sum + day.avgViewers, 0) / dayStats.length;

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat p-4" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-black">TwitchTracker Day of Week Performance</h1>
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
              <div className="text-2xl font-bold text-purple-700">{bestViewerDay.day}</div>
              <div className="text-purple-600">Best Viewer Day</div>
              <div className="text-sm text-gray-600">{Math.round(bestViewerDay.avgViewers)} avg viewers</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-blue-700">{longestStreamDay.day}</div>
              <div className="text-blue-600">Longest Stream Day</div>
              <div className="text-sm text-gray-600">{Math.round(longestStreamDay.totalDuration / 60)}h {longestStreamDay.totalDuration % 60}m</div>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-green-700">{Math.round(avgViewersOverall)}</div>
              <div className="text-green-600">Avg Weekly Viewers</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-yellow-700">{Math.round(totalMinutes / 60)}h</div>
              <div className="text-yellow-600">Total Weekly Hours</div>
              <div className="text-sm text-gray-600">{totalMinutes} minutes</div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance by Day of Week</h2>
            <div style={{ height: '400px' }}>
              <Bar data={chartData} options={barChartOptions} />
            </div>
          </div>
          
          {/* Day Details Table */}
          <div className="bg-gray-50 rounded-lg p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Viewers</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stream Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dayStats.map((dayData) => (
                    <tr key={dayData.day} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dayData.day}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Math.round(dayData.avgViewers)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.floor(dayData.totalDuration / 60)}h {dayData.totalDuration % 60}m
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dayData.streamCount || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dayData.streamCount ? Math.round(dayData.totalDuration / dayData.streamCount) + 'm' : 'N/A'}
                      </td>
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

export default DayOfWeekStatsPage;

