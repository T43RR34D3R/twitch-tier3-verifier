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

export default function ModAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ChannelSummary | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  
  // Hardcoded for BuckFoozle for now
  const targetChannelId = '269187200';
  const targetChannelName = 'BuckFoozle';

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
          <h1 className="text-3xl font-bold text-black mb-4">Moderator Analytics for {targetChannelName}</h1>
          
          {summary ? (
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

        </div>
      </div>
    </div>
  );
}

