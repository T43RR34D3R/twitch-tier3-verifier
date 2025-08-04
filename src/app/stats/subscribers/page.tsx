"use client";
import '../../../lib/chartConfig';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Line, Bar } from 'react-chartjs-2';
import { timeChartOptions, barChartOptions } from '@/lib/chartConfig';

export default function SubscriberStatsPage() {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [viewType, setViewType] = useState<'monthly' | 'tiers'>('monthly');
  
  const { data, error } = useSWR(
    dateRange.startDate && dateRange.endDate 
      ? `/api/twitchtracker-stats?type=subscribers&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`
      : null
  );

  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setMonth(endDate.getMonth() - 12); // Last 12 months
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  }, []);

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  if (error) return <div className="p-8 text-red-600">Error loading subscriber stats</div>;
  if (!data) return <div className="p-8">Loading subscriber statistics...</div>;

  const monthlyData = {
    labels: data.data.map((item: { month_year: string }) => item.month_year),
    datasets: [
      {
        label: 'Total Subs',
        data: data.data.map((item: { total_subs: number }) => item.total_subs),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
      },
      {
        label: 'Tier 1 + Prime',
        data: data.data.map((item: { tier1_prime_subs: number }) => item.tier1_prime_subs),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: false,
      },
      {
        label: 'Tier 2',
        data: data.data.map((item: { tier2_subs: number }) => item.tier2_subs),
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        fill: false,
      },
      {
        label: 'Tier 3',
        data: data.data.map((item: { tier3_subs: number }) => item.tier3_subs),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
      },
      {
        label: 'Gifted',
        data: data.data.map((item: { gifted_subs: number }) => item.gifted_subs),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        fill: false,
      }
    ],
  };

  const tierComparisonData = {
    labels: ['Tier 1 + Prime', 'Tier 2', 'Tier 3', 'Gifted', 'Undefined'],
    datasets: [
      {
        label: 'Average Monthly Subs',
        data: [
          Math.round(data.data.reduce((sum: number, item: { tier1_prime_subs: number }) => sum + item.tier1_prime_subs, 0) / data.data.length),
          Math.round(data.data.reduce((sum: number, item: { tier2_subs: number }) => sum + item.tier2_subs, 0) / data.data.length),
          Math.round(data.data.reduce((sum: number, item: { tier3_subs: number }) => sum + item.tier3_subs, 0) / data.data.length),
          Math.round(data.data.reduce((sum: number, item: { gifted_subs: number }) => sum + item.gifted_subs, 0) / data.data.length),
          Math.round(data.data.reduce((sum: number, item: { undefined_subs: number }) => sum + item.undefined_subs, 0) / data.data.length),
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(201, 203, 207, 0.6)'
        ],
      }
    ],
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat p-4" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-black">Subscriber Statistics</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setViewType('monthly')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewType === 'monthly' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Monthly Trends
              </button>
              <button
                onClick={() => setViewType('tiers')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewType === 'tiers' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tier Comparison
              </button>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  className="border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  className="border rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Chart Container */}
          <div className="bg-white rounded-lg p-6" style={{ height: '500px' }}>
            {viewType === 'monthly' ? (
              <Line 
                data={monthlyData} 
                options={{
                  ...timeChartOptions,
                  plugins: {
                    ...timeChartOptions.plugins,
                    title: {
                      display: true,
                      text: 'Monthly Subscriber Trends'
                    }
                  }
                }} 
              />
            ) : (
              <Bar 
                data={tierComparisonData} 
                options={{
                  ...barChartOptions,
                  plugins: {
                    ...barChartOptions.plugins,
                    title: {
                      display: true,
                      text: 'Average Subscribers by Tier'
                    }
                  }
                }} 
              />
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700">
                {data.data.length > 0 ? data.data[data.data.length - 1].total_subs : 0}
              </div>
              <div className="text-blue-600">Current Total Subs</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">
                {Math.round(data.data.reduce((sum: number, item: { total_subs: number }) => sum + item.total_subs, 0) / data.data.length)}
              </div>
              <div className="text-green-600">Average Monthly Subs</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-700">
                {Math.max(...data.data.map((item: { total_subs: number }) => item.total_subs))}
              </div>
              <div className="text-purple-600">Peak Subscribers</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-700">
                {data.data.length > 0 ? Math.round(((data.data[data.data.length - 1] as { gifted_subs: number; total_subs: number }).gifted_subs / (data.data[data.data.length - 1] as { gifted_subs: number; total_subs: number }).total_subs) * 100) : 0}%
              </div>
              <div className="text-yellow-600">Gifted Sub Ratio</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
