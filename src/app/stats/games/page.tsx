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

  if (error) return <div>Error loading game stats</div>;
  if (!data) return <div>Loading...</div>;

  const chartData = {
    labels: data.data.map((item: { game_name: string }) => item.game_name),
    datasets: [
      {
        label: 'Total Hours Streamed',
        data: data.data.map((item: { total_hours_streamed: number }) => item.total_hours_streamed),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Average Viewers',
        data: data.data.map((item: { avg_viewers: number }) => item.avg_viewers),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      }
    ],
  };


  return (
    <div>
      <StatsNavigation />
      <h1>TwitchTracker Statistics - Games</h1>
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={barChartOptions} />
      </div>
    </div>
  );
};

export default GameStatsPage;

