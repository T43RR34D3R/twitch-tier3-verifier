"use client";
// Analytics dashboard for viewing moderated channels

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

interface ChannelSummary {
  latest?: {
    follower_count?: number;
    subscriber_count?: number;
    tier1_subs?: number;
    tier2_subs?: number;
    tier3_subs?: number;
  };
  avgViewersLast30Days?: number;
  totalStreamTimeLast30Days?: number;
  channelInfo?: {
    displayName?: string;
  };
}

import useSWR from 'swr';
import { TwitchTrackerData } from '@/lib/twitchtracker';

export default function ModAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ChannelSummary | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [scopes, setScopes] = useState<string[]>([]);
  const [scopeError, setScopeError] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<{
    user_id: string;
    user_name: string;
    tier: string;
    is_gift: boolean;
    gifter_name?: string;
    created_at: string;
  }[]>([]);
  const [subscriberLoading, setSubscriberLoading] = useState(false);
  const [subscriberMessage, setSubscriberMessage] = useState<string>('');
  const [collectingData, setCollectingData] = useState(false);
  const [collectionMessage, setCollectionMessage] = useState<string>('');
  const [testingDatabase, setTestingDatabase] = useState(false);
  const [testMessage, setTestMessage] = useState<string>('');
  
  const fetchTwitchTrackerData = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error fetching TwitchTracker data');
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data as TwitchTrackerData;
  };
  const { data: twitchTrackerData, error: twitchTrackerError } = useSWR('/api/twitchtracker?channel=buckfoozle&static=true', fetchTwitchTrackerData);
  const targetChannelId = '269187200';
  const targetChannelName = 'BuckFoozle';

  const checkScopes = useCallback(async () => {
    try {
      const response = await fetch('/api/check-scopes');
      const data = await response.json();
      if (data.scopes) {
        setScopes(data.scopes);
      } else {
        setScopeError(data.error || 'Failed to fetch scopes');
      }
    } catch (error) {
      setScopeError('Error checking scopes');
      console.error('Error checking scopes:', error);
    }
  }, []);

  const loadSubscriberData = useCallback(async () => {
    try {
      const response = await fetch(`/api/subscribers?type=list&broadcaster_id=${targetChannelId}`);
      const data = await response.json();
      if (data.success) {
        setSubscribers(data.subscribers || []);
      }
    } catch (error) {
      console.error('Error loading subscriber data:', error);
    }
  }, [targetChannelId]);

  const fetchAndStoreSubscribers = useCallback(async () => {
    try {
      setSubscriberLoading(true);
      setSubscriberMessage('');
      const response = await fetch('/api/subscribers', { method: 'GET' });
      const data = await response.json();
      if (data.success) {
        setSubscriberMessage(data.message || 'Subscriber data refreshed successfully!');
        // Optionally reload the page or fetch updated subscriber data
        loadSubscriberData();
      } else {
        setSubscriberMessage(data.error || 'Failed to refresh subscriber data.');
      }
    } catch (error) {
      setSubscriberMessage('Error fetching subscriber data.');
      console.error('Error fetching subscriber data:', error);
    } finally {
      setSubscriberLoading(false);
    }
  }, [loadSubscriberData]);

  const collectTwitchTrackerData = useCallback(async () => {
    try {
      setCollectingData(true);
      setCollectionMessage('');
      const response = await fetch('/api/collect-twitchtracker?channel=buckfoozle&channel_id=269187200&static=true', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        setCollectionMessage('TwitchTracker data collected successfully! Check the stats pages.');
      } else {
        setCollectionMessage(data.error || 'Failed to collect TwitchTracker data.');
      }
    } catch (error) {
      setCollectionMessage('Error collecting TwitchTracker data.');
      console.error('Error collecting TwitchTracker data:', error);
    } finally {
      setCollectingData(false);
    }
  }, []);

  const testDatabase = useCallback(async () => {
    try {
      setTestingDatabase(true);
      setTestMessage('');
      const response = await fetch('/api/test-twitchtracker');
      const data = await response.json();
      if (data.success) {
        setTestMessage(`✅ ${data.message}`);
      } else {
        setTestMessage(`❌ ${data.message || 'Database test failed'}`);
      }
    } catch (error) {
      setTestMessage('❌ Error testing database connection.');
      console.error('Error testing database:', error);
    } finally {
      setTestingDatabase(false);
    }
  }, []);

  const loadModAnalytics = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?type=summary&channel_id=${targetChannelId}`);
      
      if (response.status === 403) {
        setAccessDenied(true);
        return;
      }
      
      const data = await response.json();
      setSummary(data.summary);

    } catch (error) {
      console.error('Error loading moderator analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [session, targetChannelId]);

  useEffect(() => {
    if (status === "authenticated") {
      loadModAnalytics();
    }
  }, [status, loadModAnalytics]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="bg-white rounded-xl shadow-2xl p-8 relative z-10">
          <div className="text-xl text-black">Loading Moderator Analytics for {targetChannelName}...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }
    
  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="mb-4">You do not have moderator permissions for {targetChannelName}.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Back to Main App
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat p-4" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-black">Moderator Analytics for {targetChannelName}</h1>
            <button
              onClick={checkScopes}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Check My Scopes
            </button>
          </div>
          
          {/* Scope Information */}
          {scopes.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">🔑 Your Current Scopes:</h3>
              <div className="flex flex-wrap gap-2">
                {scopes.map((scope) => (
                  <span 
                    key={scope} 
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      scope.includes('subscription') ? 'bg-blue-100 text-blue-800' :
                      scope.includes('follower') ? 'bg-purple-100 text-purple-800' :
                      scope.includes('moderator') ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {scope}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <p><strong>Note:</strong> To see subscriber data for moderated channels, BuckFoozle would need to grant you access to his subscriber information.</p>
                <p className="mt-1">The <code>channel:read:subscriptions</code> scope only works for your own channel, not channels you moderate.</p>
              </div>
            </div>
          )}
          
          {scopeError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">Error checking scopes: {scopeError}</p>
            </div>
          )}
          
          {/* Data Management Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">📊 Data Management</h3>
              <div className="flex gap-3">
                <button
                  onClick={testDatabase}
                  disabled={testingDatabase}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  {testingDatabase ? 'Testing...' : 'Test Database'}
                </button>
                <button
                  onClick={collectTwitchTrackerData}
                  disabled={collectingData}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  {collectingData ? 'Collecting...' : 'Collect TwitchTracker Data'}
                </button>
                <button
                  onClick={fetchAndStoreSubscribers}
                  disabled={subscriberLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  {subscriberLoading ? 'Fetching...' : 'Refresh Subscriber Data'}
                </button>
              </div>
            </div>
            
            {testMessage && (
              <div className={`p-3 rounded-lg mb-4 ${
                testMessage.includes('✅') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {testMessage}
              </div>
            )}
            
            {collectionMessage && (
              <div className={`p-3 rounded-lg mb-4 ${
                collectionMessage.includes('success') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {collectionMessage}
              </div>
            )}
            
            {subscriberMessage && (
              <div className={`p-3 rounded-lg mb-4 ${
                subscriberMessage.includes('success') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {subscriberMessage}
              </div>
            )}
            
            {subscribers.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-700 mb-3">Recent Subscribers ({subscribers.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                  {subscribers.slice(0, 20).map((sub, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border">
                      <div className="font-medium text-gray-900">{sub.user_name}</div>
                      <div className="text-sm text-gray-600">Tier {sub.tier}</div>
                      {sub.is_gift && (
                        <div className="text-xs text-purple-600">🎁 Gift from {sub.gifter_name}</div>
                      )}
                      <div className="text-xs text-gray-500">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
                {subscribers.length > 20 && (
                  <div className="text-sm text-gray-600 mt-2">
                    Showing 20 of {subscribers.length} subscribers
                  </div>
                )}
              </div>
            )}
          </div>
          
          {twitchTrackerData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-purple-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-purple-700">{twitchTrackerData.totalFollowers.toLocaleString() || 0}</div>
                <div className="text-purple-600">Total Followers</div>
                <div className="text-sm text-gray-600">Rank: #{twitchTrackerData.rank}, Top {twitchTrackerData.topPercentage}</div>
              </div>
               <div className="bg-blue-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-blue-700">{twitchTrackerData.currentActiveSubs.toLocaleString() || 0}</div>
                <div className="text-blue-600">Total Subscribers (Current)</div>
              </div>
               <div className="bg-green-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-green-700">{twitchTrackerData.avgViewers30Days.toLocaleString() || 0}</div>
                <div className="text-green-600">Avg Viewers (30d)</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-yellow-700">{twitchTrackerData.totalHoursStreamed.toFixed(1)}h</div>
                <div className="text-yellow-600">Total Hours Streamed</div>
              </div>
            </div>
          ) : twitchTrackerError ? (
             <p className="text-red-600">Error fetching TwitchTracker data.</p>
          ) : summary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-purple-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-purple-700">{summary.latest?.follower_count?.toLocaleString() || 0}</div>
                <div className="text-purple-600">Total Followers</div>
              </div>
               <div className="bg-blue-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-blue-700">{summary.latest?.subscriber_count?.toLocaleString() || 0}</div>
                <div className="text-blue-600">Total Subscribers</div>
              </div>
               <div className="bg-green-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-green-700">{summary.avgViewersLast30Days?.toLocaleString() || 0}</div>
                <div className="text-green-600">Avg Viewers (30d)</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-6">
                <div className="text-2xl font-bold text-yellow-700">{summary.totalStreamTimeLast30Days?.toLocaleString() || 0}h</div>
                <div className="text-yellow-600">Stream Time (30d)</div>
              </div>
            </div>
          ) : (
             <p className="text-black">No summary data available.</p>
          )}
          
          {/* Navigation to Stats Pages */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 TwitchTracker Historical Analytics</h3>
            <p className="text-gray-600 mb-4">View detailed historical data and analytics from TwitchTracker.</p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/stats"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                📊 Summary Dashboard
              </a>
              <a
                href="/stats/daily"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                📅 Daily Stats
              </a>
              <a
                href="/stats/games"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                🎮 Game Stats
              </a>
              <a
                href="/stats/subscribers"
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                👥 Subscriber Trends
              </a>
              <a
                href="/stats/day-of-week"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                📈 Weekly Performance
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

