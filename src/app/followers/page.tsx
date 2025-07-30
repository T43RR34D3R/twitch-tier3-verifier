"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Line, Bar } from "react-chartjs-2";
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
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
);

interface Follower {
  user_id: string;
  user_name: string;
  user_login: string;
  followed_at: string;
}


interface FollowerStats {
  totalFollowers: number;
  followersLast7Days: number;
  followersLast30Days: number;
  averageFollowersPerDay: number;
  longestFollowers: Follower[];
  recentFollowers: Follower[];
  dailyGrowth: {
    date: string;
    followers: number;
    newFollowers: number;
  }[];
  debugInfo?: string[]; // Add debug information
}

export default function FollowersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [stats, setStats] = useState<FollowerStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'username' | 'followed_at'>('followed_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [, setTotalFollowers] = useState(0);
  const followersPerPage = 25;

  const loadFollowers = useCallback(async () => {
    setLoading(true);
    try {
      // Load follower statistics
      const statsResponse = await fetch('/api/analytics?type=follower_stats');
      
      if (statsResponse.status === 403) {
        setAccessDenied(true);
        return;
      }
      
      const statsData = await statsResponse.json();
      
      // Load follower list
      const followersResponse = await fetch('/api/analytics?type=followers');
      
      if (followersResponse.status === 403) {
        setAccessDenied(true);
        return;
      }
      
      const followersData = await followersResponse.json();
      
      if (statsData) {
        setStats(statsData.stats);
      }
      
      if (followersData) {
        setFollowers(followersData.followers || []);
        setTotalFollowers(followersData.total || 0);
      }
    } catch (error) {
      console.error('Error loading followers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    loadFollowers();
  }, [session, status, router, loadFollowers]);

  const getFilteredFollowers = () => {
    let filtered = followers;
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(follower => 
        follower.user_name.toLowerCase().includes(searchLower) ||
        follower.user_login.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'username':
          aValue = a.user_name.toLowerCase();
          bValue = b.user_name.toLowerCase();
          break;
        case 'followed_at':
          aValue = new Date(a.followed_at).getTime();
          bValue = new Date(b.followed_at).getTime();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  };

  const getPaginatedFollowers = () => {
    const filtered = getFilteredFollowers();
    const startIndex = (currentPage - 1) * followersPerPage;
    const endIndex = startIndex + followersPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(getFilteredFollowers().length / followersPerPage);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFollowerGrowthChartData = () => {
    if (!stats?.dailyGrowth?.length) return { labels: [], datasets: [] };

    return {
      labels: stats.dailyGrowth.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Total Followers',
          data: stats.dailyGrowth.map(d => d.followers),
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          tension: 0.1,
          yAxisID: 'y',
        },
        {
          label: 'New Followers',
          data: stats.dailyGrowth.map(d => d.newFollowers),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.1,
          yAxisID: 'y1',
        },
      ],
    };
  };

  const getFollowerDistributionData = () => {
    if (!stats?.dailyGrowth?.length) return { labels: [], datasets: [] };

    // Group by month for distribution
    const monthlyData = stats.dailyGrowth.reduce((acc, day) => {
      const month = new Date(day.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!acc[month]) acc[month] = 0;
      acc[month] += day.newFollowers;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(monthlyData),
      datasets: [
        {
          label: 'New Followers',
          data: Object.values(monthlyData),
          backgroundColor: 'rgba(147, 51, 234, 0.8)',
          borderColor: 'rgb(147, 51, 234)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="bg-white rounded-xl shadow-2xl p-8 relative z-10">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            <h2 className="text-lg font-bold mb-2">Access Denied</h2>
            <p className="mb-4">You don&apos;t have permission to view analytics data.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Back to Main App
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="bg-white rounded-xl shadow-2xl p-8 relative z-10">
          <div className="text-xl text-black">Loading Followers...</div>
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
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-black">Followers Analytics</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/analytics')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Back to Analytics
                </button>
              </div>
            </div>
          </div>

          {/* Debug Information */}
          {stats?.debugInfo && stats.debugInfo.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">📊 Data Status</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                {stats.debugInfo.map((info, index) => (
                  <li key={index}>• {info}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-purple-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-purple-700">{(stats.totalFollowers ?? 0).toLocaleString()}</div>
                <div className="text-purple-600">Total Followers</div>
              </div>
              <div className="bg-green-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-green-700">{(stats.followersLast7Days ?? 0).toLocaleString()}</div>
                <div className="text-green-600">New Followers (7d)</div>
                {stats.followersLast7Days === 0 && stats.totalFollowers > 0 && (
                  <div className="text-xs text-green-500 mt-1">
                    No new followers in the last 7 days
                  </div>
                )}
              </div>
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-blue-700">{(stats.followersLast30Days ?? 0).toLocaleString()}</div>
                <div className="text-blue-600">New Followers (30d)</div>
                {stats.followersLast30Days === 0 && stats.totalFollowers > 0 && (
                  <div className="text-xs text-blue-500 mt-1">
                    No new followers in the last 30 days
                  </div>
                )}
              </div>
              <div className="bg-orange-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-orange-700">{(stats.averageFollowersPerDay ?? 0).toFixed(1)}</div>
                <div className="text-orange-600">Avg per Day</div>
                {stats.averageFollowersPerDay === 0 && stats.totalFollowers > 0 && (
                  <div className="text-xs text-orange-500 mt-1">
                    Based on last 30 days
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-black mb-4">Follower Growth</h2>
              <div className="h-64">
                <Line data={getFollowerGrowthChartData()} options={chartOptions} />
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-black mb-4">Monthly Distribution</h2>
              <div className="h-64">
                <Bar data={getFollowerDistributionData()} options={{responsive: true, maintainAspectRatio: false}} />
              </div>
            </div>
          </div>

          {/* Longest Followers Leaderboard */}
          {stats?.longestFollowers && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-black mb-4">Longest Followers 👑</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.longestFollowers.slice(0, 9).map((follower, index) => (
                  <div key={follower.user_id} className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-black">{follower.user_name}</div>
                        <div className="text-sm text-gray-500">@{follower.user_login}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-purple-600 font-medium">#{index + 1}</div>
                        <div className="text-xs text-gray-500">{formatDate(follower.followed_at)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Followers */}
          {stats?.recentFollowers && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-black mb-4">Recent Followers 🌟</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.recentFollowers.slice(0, 9).map((follower) => (
                  <div key={follower.user_id} className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-black">{follower.user_name}</div>
                        <div className="text-sm text-gray-500">@{follower.user_login}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-green-600 font-medium">NEW</div>
                        <div className="text-xs text-gray-500">{formatDate(follower.followed_at)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Followers Table */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <h2 className="text-xl font-bold text-black mb-4 lg:mb-0">All Followers</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Search:</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Username..."
                    className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'username' | 'followed_at')}
                    className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    <option value="followed_at">Follow Date</option>
                    <option value="username">Username</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-2 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Follow Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Days Following
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPaginatedFollowers().map((follower) => (
                      <tr key={follower.user_id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {follower.user_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                @{follower.user_login}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(follower.followed_at)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {Math.floor((Date.now() - new Date(follower.followed_at).getTime()) / (1000 * 60 * 60 * 24))} days
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {getTotalPages() > 1 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {Math.min((currentPage - 1) * followersPerPage + 1, getFilteredFollowers().length)} to{' '}
                    {Math.min(currentPage * followersPerPage, getFilteredFollowers().length)} of{' '}
                    {getFilteredFollowers().length} followers
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-white border border-gray-300 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {getTotalPages()}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(getTotalPages(), currentPage + 1))}
                      disabled={currentPage === getTotalPages()}
                      className="px-3 py-1 bg-white border border-gray-300 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
