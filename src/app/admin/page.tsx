"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface VerificationLog {
  id: string;
  userName: string;
  userId: string;
  timestamp: string;
  success: boolean;
  message: string;
}

interface PageTexts {
  title: string;
  subtitle: string;
  signInText: string;
  steps: string[];
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>([]);
  const [pageTexts, setPageTexts] = useState<PageTexts>({
    title: "Tier 3 Verification",
    subtitle: "Verify your Tier 3 subscription to submit info for your custom T3 cheer!",
    signInText: "Please sign in with your Twitch account to verify your subscription status.",
    steps: ["Signed In", "Checking Follow", "Checking Tier 3", "Verified"]
  });
  const [editingTexts, setEditingTexts] = useState<PageTexts>(pageTexts);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
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

  const loadVerificationLogs = () => {
    // This would typically load from a database
    // For now, we'll use mock data
    const mockLogs: VerificationLog[] = [
      {
        id: "1",
        userName: "TearReader",
        userId: "441862265",
        timestamp: new Date().toISOString(),
        success: true,
        message: "Tier 3 subscription verified! (Override for TearReader)"
      },
      {
        id: "2", 
        userName: "TestUser",
        userId: "123456789",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        success: false,
        message: "Not subscribed to the channel"
      }
    ];
    setVerificationLogs(mockLogs);
  };

  const loadPageTexts = () => {
    // Load current page texts (would come from database/config)
    setPageTexts(pageTexts);
    setEditingTexts(pageTexts);
  };

  const savePageTexts = () => {
    // Save texts to database/config
    setPageTexts(editingTexts);
    alert("Page texts saved successfully!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="bg-white rounded-xl shadow-2xl p-8 relative z-10">
          <div className="text-xl text-black">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="bg-white rounded-xl shadow-2xl p-8 relative z-10">
          <div className="text-xl text-red-600">Access Denied</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat p-4" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div 
        className="absolute inset-0" 
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 100%)'
        }}
      ></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="bg-white rounded-xl shadow-2xl drop-shadow-2xl p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome, {session?.user?.name}! Manage your Tier 3 verifier.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Verification Logs */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-black">Recent Verifications</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {verificationLogs.length === 0 ? (
                  <p className="text-gray-500">No verification attempts yet.</p>
                ) : (
                  <div className="space-y-3">
                    {verificationLogs.map((log) => (
                      <div key={log.id} className={`p-3 rounded-lg border-l-4 ${
                        log.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-black">{log.userName}</div>
                            <div className="text-sm text-gray-600">ID: {log.userId}</div>
                            <div className={`text-sm ${log.success ? 'text-green-700' : 'text-red-700'}`}>
                              {log.message}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
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
              <h2 className="text-2xl font-bold text-black">Customize Page Text</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Main Title</label>
                  <input
                    type="text"
                    value={editingTexts.title}
                    onChange={(e) => setEditingTexts({...editingTexts, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Subtitle</label>
                  <textarea
                    value={editingTexts.subtitle}
                    onChange={(e) => setEditingTexts({...editingTexts, subtitle: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Sign In Text</label>
                  <textarea
                    value={editingTexts.signInText}
                    onChange={(e) => setEditingTexts({...editingTexts, signInText: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Progress Steps</label>
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
                      className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={`Step ${index + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={savePageTexts}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Save Changes
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

          {/* Back to Main */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push("/")}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Back to Main App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
