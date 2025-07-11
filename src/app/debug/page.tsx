"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function DebugPage() {
  const { data: session, status } = useSession();

  const handleForceSignOut = async () => {
    // Clear all local storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Sign out from NextAuth
    await signOut({ redirect: false });
    
    // Reload the page to clear any cached data
    window.location.reload();
  };

  const handleForceSignIn = async () => {
    // Clear any cached data first
    localStorage.clear();
    sessionStorage.clear();
    
    // Force a new authorization with prompt=consent
    await signIn("twitch", { 
      callbackUrl: "/debug",
      // This will force Twitch to show the authorization screen again
      redirect: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Authentication</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          <p className="mb-2"><strong>Status:</strong> {status}</p>
          
          {session ? (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="font-semibold text-green-800 mb-2">✅ Authenticated</h3>
              <p><strong>User:</strong> {session.user?.name}</p>
              <p><strong>Email:</strong> {session.user?.email}</p>
              <p><strong>Has Access Token:</strong> {session.accessToken ? "Yes" : "No"}</p>
              <p><strong>Has Error:</strong> {session.error || "No"}</p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h3 className="font-semibold text-red-800">❌ Not Authenticated</h3>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-4">
            <button
              onClick={handleForceSignOut}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              🔄 Force Sign Out & Clear Cache
            </button>
            
            <button
              onClick={handleForceSignIn}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              🔑 Force Fresh Sign In
            </button>
            
            <button
              onClick={() => signIn("twitch")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              📝 Regular Sign In
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <div className="space-y-2 text-gray-700">
            <p>1. Click <strong>"Force Sign Out & Clear Cache"</strong> to completely clear your session</p>
            <p>2. Click <strong>"Force Fresh Sign In"</strong> to start a new authorization flow</p>
            <p>3. This should show the Twitch authorization screen again</p>
            <p>4. If it still doesn't work, try using an incognito/private browser window</p>
          </div>
        </div>
      </div>
    </div>
  );
}
