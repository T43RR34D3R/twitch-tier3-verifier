"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface LoginLog {
  id: number;
  user_id: string;
  username: string;
  display_name?: string;
  email?: string;
  ip_address?: string;
  user_agent?: string;
  login_method: string;
  is_successful: boolean;
  failure_reason?: string;
  login_at: string;
}

interface LoginStats {
  total_logins: number;
  unique_users: number;
  successful_logins: number;
  failed_logins: number;
  logins_24h: number;
  logins_7d: number;
  logins_30d: number;
}

export default function LoginLogsPanel() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [stats, setStats] = useState<LoginStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'logs' | 'stats'>('logs');
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    loadData();
  }, [limit]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load recent logs
      const logsResponse = await fetch(`/api/admin/login-logs?action=recent&limit=${limit}`);
      const logsData = await logsResponse.json();
      
      if (logsData.success) {
        setLogs(logsData.data);
      } else {
        setError(logsData.error || 'Failed to load logs');
      }

      // Load stats
      const statsResponse = await fetch('/api/admin/login-logs?action=stats');
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setStats(statsData.data);
      }

    } catch (err) {
      setError('Failed to load login logs');
      console.error('Error loading login logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserLogs = async (userId: string) => {
    if (!userId.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/login-logs?action=user&userId=${userId}&limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data);
        setSelectedUserId(userId);
      } else {
        setError(data.error || 'Failed to load user logs');
      }
    } catch {
      setError('Failed to load user logs');
    } finally {
      setLoading(false);
    }
  };

  const clearUserFilter = () => {
    setSelectedUserId("");
    loadData();
  };

  const getBrowserInfo = (userAgent?: string) => {
    if (!userAgent) return 'Unknown';
    
    // Simple browser detection
    if (userAgent.includes('Chrome/')) return '🌐 Chrome';
    if (userAgent.includes('Firefox/')) return '🦊 Firefox';
    if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) return '🧭 Safari';
    if (userAgent.includes('Edge/')) return '🔷 Edge';
    
    return '🌐 Browser';
  };

  const getOSInfo = (userAgent?: string) => {
    if (!userAgent) return '';
    
    if (userAgent.includes('Windows')) return '🪟';
    if (userAgent.includes('Macintosh')) return '🍎';
    if (userAgent.includes('Linux')) return '🐧';
    if (userAgent.includes('Android')) return '🤖';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return '📱';
    
    return '💻';
  };

  const renderStatsTab = () => {
    if (!stats) return <div>Loading stats...</div>;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="text-2xl font-bold text-white">{stats.total_logins}</div>
            <div className="text-sm text-white/70">Total Logins</div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="text-2xl font-bold text-white">{stats.unique_users}</div>
            <div className="text-sm text-white/70">Unique Users</div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="text-2xl font-bold text-green-400">{stats.successful_logins}</div>
            <div className="text-sm text-white/70">Successful</div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="text-2xl font-bold text-red-400">{stats.failed_logins}</div>
            <div className="text-sm text-white/70">Failed</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="text-xl font-bold text-blue-400">{stats.logins_24h}</div>
            <div className="text-sm text-white/70">Last 24 Hours</div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="text-xl font-bold text-blue-400">{stats.logins_7d}</div>
            <div className="text-sm text-white/70">Last 7 Days</div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="text-xl font-bold text-blue-400">{stats.logins_30d}</div>
            <div className="text-sm text-white/70">Last 30 Days</div>
          </div>
        </div>

        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-2">Success Rate</h3>
          <div className="w-full bg-white/10 rounded-full h-4">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all duration-500"
              style={{ 
                width: `${stats.total_logins > 0 ? (stats.successful_logins / stats.total_logins) * 100 : 0}%` 
              }}
            />
          </div>
          <div className="text-sm text-white/70 mt-1">
            {stats.total_logins > 0 ? ((stats.successful_logins / stats.total_logins) * 100).toFixed(1) : 0}% success rate
          </div>
        </div>
      </div>
    );
  };

  const renderLogsTab = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by User ID"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm"
          />
          <button
            onClick={() => loadUserLogs(selectedUserId)}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            Search
          </button>
          {selectedUserId && (
            <button
              onClick={clearUserFilter}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
            >
              Clear
            </button>
          )}
        </div>
        
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
        >
          <option value={25}>25 logs</option>
          <option value={50}>50 logs</option>
          <option value={100}>100 logs</option>
          <option value={200}>200 logs</option>
        </select>

        <button
          onClick={loadData}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white/80">Time</th>
              <th className="text-left py-2 px-3 text-white/80">User</th>
              <th className="text-left py-2 px-3 text-white/80">Status</th>
              <th className="text-left py-2 px-3 text-white/80">IP</th>
              <th className="text-left py-2 px-3 text-white/80">Device</th>
              <th className="text-left py-2 px-3 text-white/80">Method</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 px-3 text-white/70">
                  {format(new Date(log.login_at), 'MMM dd, HH:mm:ss')}
                </td>
                <td className="py-2 px-3">
                  <div className="text-white font-medium">{log.username}</div>
                  <div className="text-xs text-white/50">{log.user_id}</div>
                </td>
                <td className="py-2 px-3">
                  {log.is_successful ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                      ✓ Success
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full">
                      ✗ Failed
                    </span>
                  )}
                  {log.failure_reason && (
                    <div className="text-xs text-red-400 mt-1">{log.failure_reason}</div>
                  )}
                </td>
                <td className="py-2 px-3 text-white/70 font-mono text-xs">
                  {log.ip_address || 'N/A'}
                </td>
                <td className="py-2 px-3 text-white/70">
                  <div className="flex items-center gap-1">
                    <span>{getOSInfo(log.user_agent)}</span>
                    <span className="text-xs">{getBrowserInfo(log.user_agent)}</span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-full">
                    {log.login_method}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logs.length === 0 && !loading && (
        <div className="text-center py-8 text-white/50">
          No login logs found
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Login Logs</h2>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-white/5 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
            activeTab === 'logs'
              ? 'bg-blue-600 text-white'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Recent Logs
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
            activeTab === 'stats'
              ? 'bg-blue-600 text-white'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Statistics
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-white/70">Loading login logs...</div>
        </div>
      ) : (
        <div className="min-h-[400px]">
          {activeTab === 'logs' && renderLogsTab()}
          {activeTab === 'stats' && renderStatsTab()}
        </div>
      )}
    </div>
  );
}
