"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { ContentConfig } from "../../../lib/content";

type UserActivity = {
  id: string;
  username: string;
  action: string;
  timestamp: string;
  success: boolean;
  details?: string;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [content, setContent] = useState<ContentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [previewType, setPreviewType] = useState<'main' | 'account' | 'signin' | null>(null);
  const [activityLog, setActivityLog] = useState<UserActivity[]>([]);
  const [isActivityLogExpanded, setIsActivityLogExpanded] = useState(false);
  const [isLoadingActivityLog, setIsLoadingActivityLog] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      setIsLoading(false);
      return;
    }
    console.log("Session user:", session?.user);
    const allowedUsers = ["TearReader", "BuckFoozle", "tearreader", "buckfoozle"];
    if (!allowedUsers.includes(session?.user?.name || "")) {
      setMessage(`Unauthorized access. Current user: ${session?.user?.name}`);
      setIsLoading(false);
      return;
    }
    loadContent();
  }, [session, status]);

  const loadContent = async () => {
    try {
      const response = await fetch("/api/content");
      const data = await response.json();
      setContent(data);
    } catch (error) {
      console.error("Error loading content:", error);
      setMessage("Error loading content");
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivityLog = async () => {
    setIsLoadingActivityLog(true);
    try {
      const response = await fetch("/api/activity-log");
      if (response.ok) {
        const data = await response.json();
        setActivityLog(data);
      } else {
        console.error("Failed to load activity log");
      }
    } catch (error) {
      console.error("Error loading activity log:", error);
    } finally {
      setIsLoadingActivityLog(false);
    }
  };

  const saveContent = async () => {
    if (!content) return;
    
    setIsSaving(true);
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(content),
      });

      if (response.ok) {
        setMessage("Content saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Error saving content");
      }
    } catch (error) {
      console.error("Error saving content:", error);
      setMessage("Error saving content");
    } finally {
      setIsSaving(false);
    }
  };

  const PreviewModal = ({ type }: { type: 'main' | 'account' | 'signin' }) => {
    if (!content) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {type === 'main' ? 'Main Page Preview' : 
                 type === 'account' ? 'Account Page Preview' : 
                 'Sign In Page Preview'}
              </h3>
              <button
                onClick={() => setPreviewType(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Preview Content */}
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
              {type === 'main' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-black mb-2">{content.mainPage.title}</h1>
                  <p className="text-black mb-6">{content.mainPage.subtitle}</p>
                  <p className="text-black mb-6">{content.mainPage.signInPrompt}</p>
                  <button className="w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-lg">
                    Sign in with Twitch
                  </button>
                </div>
              )}
              
              {type === 'account' && (
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-6">{content.accountPage.title}</h1>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600">Account page content preview with your custom title...</p>
                  </div>
                </div>
              )}
              
              {type === 'signin' && (
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-800 mb-6">{content.signinPage.title}</h1>
                  <button className="w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-lg">
                    Sign in with Twitch
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Admin Panel Access Required</div>
          <p className="text-gray-600 mb-6">Sign in to continue to admin panel</p>
          <button
            onClick={() => signIn("twitch")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
            <span>Sign in with Twitch</span>
          </button>
        </div>
      </div>
    );
  }

  const allowedUsers = ["TearReader", "BuckFoozle", "tearreader", "buckfoozle"];
  if (!allowedUsers.includes(session?.user?.name || "")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">Unauthorized Access</div>
          <p className="text-gray-600">Only authorized users can access this admin panel.</p>
          <p className="text-sm text-gray-500 mt-2">Current user: {session?.user?.name}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading admin panel...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Error loading content</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Content Management</h1>
          
          {message && (
            <div className={`p-4 rounded-lg mb-6 ${
              message.includes("successfully") 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-8">
            {/* Main Page Content */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Main Page</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={content.mainPage.title}
                    onChange={(e) => setContent({
                      ...content,
                      mainPage: { ...content.mainPage, title: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle
                  </label>
                  <textarea
                    value={content.mainPage.subtitle}
                    onChange={(e) => setContent({
                      ...content,
                      mainPage: { ...content.mainPage, subtitle: e.target.value }
                    })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sign In Prompt
                  </label>
                  <textarea
                    value={content.mainPage.signInPrompt}
                    onChange={(e) => setContent({
                      ...content,
                      mainPage: { ...content.mainPage, signInPrompt: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
              </div>
              
              {/* Preview Button */}
              <div className="mt-4">
                <button
                  onClick={() => setPreviewType('main')}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Preview Main Page
                </button>
              </div>
            </div>

            {/* Account Page Content */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Page</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={content.accountPage.title}
                  onChange={(e) => setContent({
                    ...content,
                    accountPage: { ...content.accountPage, title: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              
              {/* Preview Button */}
              <div className="mt-4">
                <button
                  onClick={() => setPreviewType('account')}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Preview Account Page
                </button>
              </div>
            </div>

            {/* Sign In Page Content */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Sign In Page</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={content.signinPage.title}
                  onChange={(e) => setContent({
                    ...content,
                    signinPage: { ...content.signinPage, title: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              
              {/* Preview Button */}
              <div className="mt-4">
                <button
                  onClick={() => setPreviewType('signin')}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Preview Sign In Page
                </button>
              </div>
            </div>
          </div>

          {/* User Activity Log Section */}
          <div className="mt-8 border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">User Activity Log</h2>
              <button
                onClick={() => {
                  setIsActivityLogExpanded(!isActivityLogExpanded);
                  if (!isActivityLogExpanded && activityLog.length === 0) {
                    loadActivityLog();
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                {isActivityLogExpanded ? 'Hide' : 'Show'} Activity Log
              </button>
            </div>
            
            {isActivityLogExpanded && (
              <div className="space-y-4">
                {isLoadingActivityLog ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-gray-600">Loading activity log...</div>
                  </div>
                ) : activityLog.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    No activity logged yet.
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {activityLog.map((activity, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          activity.status === 'success' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {activity.username}
                            </div>
                            <div className="text-sm text-gray-600">
                              {activity.action}
                            </div>
                            {activity.details && (
                              <div className="text-sm text-gray-500 mt-1">
                                {activity.details}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              activity.status === 'success' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {activity.status}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(activity.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={saveContent}
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Preview Modal */}
      {previewType && <PreviewModal type={previewType} />}
    </div>
  );
}
