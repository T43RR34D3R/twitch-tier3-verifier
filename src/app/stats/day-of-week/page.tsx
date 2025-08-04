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

  if (error) return <div>Error loading day of week stats</div>;
  if (!data) return <div>Loading...</div>;

  const chartLabels = Object.keys(data.data);
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Average Viewers',
        data: chartLabels.map(day => data.data[day].avgViewers),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Total Duration (mins)',
        data: chartLabels.map(day => data.data[day].totalDuration),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      }
    ],
  };


  return (
    <div>
      <StatsNavigation />
      <h1>TwitchTracker Statistics - Day of Week</h1>
      <div style={{ height: '400px' }}>
        <Bar data={chartData} options={barChartOptions} />
      </div>
    </div>
  );
};

export default DayOfWeekStatsPage;

