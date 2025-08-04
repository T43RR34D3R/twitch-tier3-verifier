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

  if (error) return <div>Error loading daily stats</div>;
  if (!data) return <div>Loading...</div>;

  const chartData = {
    labels: data.data.map((item: { data_date: string }) => item.data_date),
    datasets: [
      {
        label: 'Total Followers',
        data: data.data.map((item: { total_followers: number }) => item.total_followers),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
      },
      {
        label: 'Active Subs',
        data: data.data.map((item: { current_active_subs: number }) => item.current_active_subs),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
      },
      {
        label: 'Avg Viewers 30 Days',
        data: data.data.map((item: { avg_viewers_30_days: number }) => item.avg_viewers_30_days),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: false,
      }
    ],
  };


  return (
    <div>
      <StatsNavigation />
      <h1>TwitchTracker Statistics - Daily</h1>
      <div style={{ height: '400px' }}>
        <Line data={chartData} options={timeChartOptions} />
      </div>
    </div>
  );
};

export default DailyStatsPage;

