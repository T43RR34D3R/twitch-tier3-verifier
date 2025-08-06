"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SiteCustomizationPanel from "../../components/SiteCustomizationPanel";

interface VerificationLog {
  id: string;
  user_name: string;
  user_id: string;
  created_at: string;
  success: boolean;
  message: string;
}

interface PageTexts {
  title: string;
  subtitle: string;
  signInText: string;
  steps: string[];
  redirectUrl?: string;
}

interface AnalyticsAccess {
  user_id: string;
  user_name: string;
  enabled: boolean;
  granted_by: string;
  granted_at: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>([]);
  const [pageTexts, setPageTexts] = useState<PageTexts>({
    title: "Tier 3 Toolkit",
    subtitle: "Verify your Tier 3 subscription to submit info for your custom T3 cheer!",
    signInText: "Please sign in with your Twitch account to verify your subscription status.",
    steps: ["Signed In", "Checking Follow", "Checking Tier 3", "Verified"]
  });
  const [editingTexts, setEditingTexts] = useState<PageTexts>(pageTexts);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [analyticsAccess, setAnalyticsAccess] = useState<AnalyticsAccess[]>([]);
  const [newUserId, setNewUserId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // TwitchAnnouncer states
  const [streamInterval, setStreamInterval] = useState<number>(120);
  const [twitchLoading, setTwitchLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/t3verify");
      return;
    }

    // Check admin status
    fetch("/api/admin/check")
      .then(res => res.json())
      .then(data => {
        if (data.isAdmin) {
          setIsAdmin(true);
          // Load verification logs and page texts here
          loadVerificationLogs();
          loadPageTexts();
          loadAnalyticsAccess();
        } else {
          router.push("/");
        }
      })
      .catch(error => {
        console.error("Error checking admin status:", error);
        router.push("/");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session, status, router]);

  const loadVerificationLogs = async () => {
    try {
      const response = await fetch('/api/admin/verification-logs');
      if (response.ok) {
        const data = await response.json();
        setVerificationLogs(data.logs || []);
      } else {
        console.error('Failed to load verification logs');
      }
    } catch (error) {
      console.error('Error loading verification logs:', error);
    }
  };

  const loadPageTexts = async () => {
    try {
      const response = await fetch('/api/admin/page-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setPageTexts(data.settings);
          setEditingTexts(data.settings);
        }
      } else {
        console.error('Failed to load page settings');
      }
    } catch (error) {
      console.error('Error loading page settings:', error);
    }
  };

  const savePageTexts = async () => {
    setSaveState('saving');
    
    try {
      const response = await fetch('/api/admin/page-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingTexts),
      });
      
      if (response.ok) {
        setPageTexts(editingTexts);
        setSaveState('saved');
        
        // Reset to idle state after 2 seconds
        setTimeout(() => {
          setSaveState('idle');
        }, 2000);
      } else {
        setSaveState('idle');
        console.error('Failed to save page texts');
      }
    } catch (error) {
      console.error('Error saving page settings:', error);
      setSaveState('idle');
    }
  };

  const loadAnalyticsAccess = async () => {
    try {
      const response = await fetch('/api/admin/analytics-access');
      if (response.ok) {
        const data = await response.json();
        setAnalyticsAccess(data.accessList || []);
      } else {
        console.error('Failed to load analytics access list');
      }
    } catch (error) {
      console.error('Error loading analytics access:', error);
    }
  };

  const addAnalyticsAccess = async () => {
    if (!newUserId) {
      alert('Please enter a User ID');
      return;
    }

    setAnalyticsLoading(true);
    try {
      const response = await fetch('/api/admin/analytics-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add',
          userId: newUserId,
          userName: newUserName,
        }),
      });

      if (response.ok) {
        setNewUserId('');
        setNewUserName('');
        loadAnalyticsAccess();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add user to analytics access');
      }
    } catch (error) {
      console.error('Error adding analytics access:', error);
      alert('Error adding user to analytics access');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const toggleAnalyticsAccess = async (userId: string) => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch('/api/admin/analytics-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle',
          userId: userId,
        }),
      });

      if (response.ok) {
        loadAnalyticsAccess();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to toggle user access');
      }
    } catch (error) {
      console.error('Error toggling analytics access:', error);
      alert('Error toggling user access');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const removeAnalyticsAccess = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from analytics access?')) {
      return;
    }

    setAnalyticsLoading(true);
    try {
      const response = await fetch('/api/admin/analytics-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'remove',
          userId: userId,
        }),
      });

      if (response.ok) {
        loadAnalyticsAccess();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove user from analytics access');
      }
    } catch (error) {
      console.error('Error removing analytics access:', error);
      alert('Error removing user from analytics access');
    } finally {
      setAnalyticsLoading(false);
    }
  };
  
  const updateStreamInterval = async () => {
    setTwitchLoading(true);
    try {
      const response = await fetch('/api/minecraft/auth/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateInterval',
          interval: streamInterval,
        }),
      });

      if (response.ok) {
        alert(`Stream check interval updated to ${streamInterval} seconds`);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update stream interval');
      }
    } catch (error) {
      console.error('Error updating stream interval:', error);
      alert('Error updating stream interval');
    } finally {
      setTwitchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 p-8 relative z-10">
          <div className="text-xl text-white flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="bg-red-900/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-red-700 p-8 relative z-10">
          <div className="text-xl text-red-400 flex items-center space-x-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>Access Denied</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-300">Welcome, {session?.user?.name}! Manage your Tier 3 verifier.</p>
          </div>

          {/* Site Customization Panel */}
          <div className="mb-8">
            <SiteCustomizationPanel />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Verification Logs */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Recent Verifications</h2>
              
              <div className="bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                {verificationLogs.length === 0 ? (
                  <p className="text-gray-300">No verification attempts yet.</p>
                ) : (
                  <div className="space-y-3">
                    {verificationLogs.map((log) => (
                      <div key={log.id} className={`p-3 rounded-lg border-l-4 ${
                        log.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-white">{log.user_name}</div>
                            <div className="text-sm text-gray-300">ID: {log.user_id}</div>
                            <div className={`text-sm ${log.success ? 'text-green-700' : 'text-red-700'}`}>
                              {log.message}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Text Customization */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Customize Page Text</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Main Title</label>
                  <input
                    type="text"
                    value={editingTexts.title}
                    onChange={(e) => setEditingTexts({...editingTexts, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white bg-gray-700 placeholder-gray-400"
                    placeholder="Enter site title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Subtitle</label>
                  <textarea
                    value={editingTexts.subtitle}
                    onChange={(e) => setEditingTexts({...editingTexts, subtitle: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white bg-gray-700 placeholder-gray-400"
                    placeholder="Enter subtitle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Sign In Text</label>
                  <textarea
                    value={editingTexts.signInText}
                    onChange={(e) => setEditingTexts({...editingTexts, signInText: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white bg-gray-700 placeholder-gray-400"
                    placeholder="Enter sign in instructions"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Progress Steps</label>
                  {editingTexts.steps.map((step, index) => (
                    <input
                      key={index}
                      type="text"
                      value={step}
                      onChange={(e) => {
                        const newSteps = [...editingTexts.steps];
                        newSteps[index] = e.target.value;
                        setEditingTexts({...editingTexts, steps: newSteps});
                      }}
                      className="w-full px-3 py-2 mb-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white bg-gray-700 placeholder-gray-400"
                      placeholder={`Step ${index + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={savePageTexts}
                  disabled={saveState === 'saving'}
                  className={`w-full font-bold py-3 px-6 rounded-lg transition-all duration-500 transform ${
                    saveState === 'saving' 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white scale-105' 
                      : saveState === 'saved'
                      ? 'bg-green-500 hover:bg-green-600 text-white scale-105 shadow-lg'
                      : 'bg-purple-600 hover:bg-purple-700 text-white scale-100'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {saveState === 'saving' && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {saveState === 'saved' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span>
                      {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved!' : 'Save Changes'}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-700">
                {verificationLogs.filter(log => log.success).length}
              </div>
              <div className="text-green-600">Successful Verifications</div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-700">
                {verificationLogs.filter(log => !log.success).length}
              </div>
              <div className="text-red-600">Failed Verifications</div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">
                {Math.round((verificationLogs.filter(log => log.success).length / Math.max(verificationLogs.length, 1)) * 100)}%
              </div>
              <div className="text-blue-600">Success Rate</div>
            </div>
          </div>

          {/* Analytics Access Management */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-black mb-6">Analytics Access Management</h2>
            
            {/* Add New User */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-black mb-4">Add User to Analytics Whitelist</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Twitch User ID</label>
                  <input
                    type="text"
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    placeholder="e.g., 123456789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Twitch Username (Optional)</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g., username (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={addAnalyticsAccess}
                    disabled={analyticsLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {analyticsLoading ? 'Adding...' : 'Add User'}
                  </button>
                </div>
              </div>
            </div>

            {/* Current Access List */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Current Analytics Access</h3>
              {analyticsAccess.length === 0 ? (
                <p className="text-black">No users have analytics access yet.</p>
              ) : (
                <div className="space-y-3">
                  {analyticsAccess.map((access) => (
                    <div key={access.user_id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium text-black">{access.user_name}</div>
                        <div className="text-sm text-gray-600">ID: {access.user_id}</div>
                        <div className="text-xs text-gray-500">
                          Granted: {new Date(access.granted_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          access.enabled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {access.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <button
                          onClick={() => toggleAnalyticsAccess(access.user_id)}
                          disabled={analyticsLoading}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                            access.enabled
                              ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {access.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => removeAnalyticsAccess(access.user_id)}
                          disabled={analyticsLoading}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TwitchNotifier Settings */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-black mb-6">TwitchNotifier Settings</h2>
              
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Stream Check Interval (seconds)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={streamInterval}
                    onChange={(e) => setStreamInterval(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => updateStreamInterval()}
                    disabled={twitchLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {twitchLoading ? 'Updating...' : 'Update Interval'}
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Redirect URL</label>
                  <input
                    type="text"
                    value={editingTexts.redirectUrl || ''}
                    onChange={(e) => setEditingTexts({...editingTexts, redirectUrl: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                    placeholder="e.g., https://example.com"
                  />
                </div>
              </div>

              <button
                onClick={savePageTexts}
                disabled={saveState === 'saving'}
                className={`block w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors ${saveState === 'saving' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Save Configuration
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="mt-8 text-center space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push("/analytics")}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Analytics Dashboard
              </button>
              <button
                onClick={() => window.open('/minecraft-chat', '_blank')}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Chat Overlay
              </button>
              <button
                onClick={() => router.push("/minecraft-test")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Test Chat
              </button>
              <button
                onClick={() => router.push("/")}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Main App
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
