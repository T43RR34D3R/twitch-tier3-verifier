"use client";
import '../../lib/chartConfig';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Line } from 'react-chartjs-2';
import { timeChartOptions } from '@/lib/chartConfig';

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

  if (error) return <div>Error loading summary stats</div>;
  if (!data) return <div>Loading...</div>;

  const datasets = [];
  if (selectedStats.followers) {
    datasets.push({
      label: 'Total Followers',
      data: data.data.channel.map((item: { total_followers: number }) => item.total_followers),
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: false,
    });
  }
  if (selectedStats.subs) {
    datasets.push({
      label: 'Active Subs',
      data: data.data.channel.map((item: { current_active_subs: number }) => item.current_active_subs),
      borderColor: 'rgba(255, 99, 132, 1)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      fill: false,
    });
  }
  if (selectedStats.viewers) {
    datasets.push({
      label: 'Avg Viewers 30 Days',
      data: data.data.channel.map((item: { avg_viewers_30_days: number }) => item.avg_viewers_30_days),
      borderColor: 'rgba(54, 162, 235, 1)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      fill: false,
    });
  }

  const chartData = {
    labels: data.data.channel.map((item: { data_date: string }) => item.data_date),
    datasets: datasets,
  };

  return (
    <div>
      <h1>Summary Statistics</h1>
      <div>
        <label>
          <input
            type="checkbox"
            checked={selectedStats.followers}
            onChange={() => setSelectedStats(prev => ({ ...prev, followers: !prev.followers }))}
          /> Followers
        </label>
        <label>
          <input
            type="checkbox"
            checked={selectedStats.subs}
            onChange={() => setSelectedStats(prev => ({ ...prev, subs: !prev.subs }))}
          /> Subs
        </label>
        <label>
          <input
            type="checkbox"
            checked={selectedStats.viewers}
            onChange={() => setSelectedStats(prev => ({ ...prev, viewers: !prev.viewers }))}
          /> Viewers
        </label>
      </div>
      <div style={{ height: '400px' }}>
        <Line data={chartData} options={timeChartOptions} />
      </div>
    </div>
  );
};

export default SummaryPage;
