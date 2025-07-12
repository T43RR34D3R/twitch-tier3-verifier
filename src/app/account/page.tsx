"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect } from "react";
import Image from "next/image";

export default function AccountPage() {
  const { data: session, status, update } = useSession();

  // Force session refresh when component mounts (only once)
  useEffect(() => {
    if (session) {
      update(); // This will refresh the session data
    }
  }, [session, update]); // Include dependencies

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Account Info</h1>
          <p className="text-gray-600 mb-6">Please sign in to view your account information</p>
          <button
            onClick={() => signIn("twitch")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
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

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat p-4 relative" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
      {/* Backdrop blur and vignette overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div 
        className="absolute inset-0" 
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 100%)'
        }}
      ></div>
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="bg-white rounded-xl shadow-2xl drop-shadow-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-black">Your Twitch Account</h1>
            <button
              onClick={() => signOut()}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>

          <div className="space-y-6">
            {/* Profile Picture and Basic Info */}
            <div className="flex items-center space-x-4">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold text-black">
                  {session.user?.name || "TearReader"}
                </h2>
                <p className="text-black">
                  {session.user?.email || "uggeenholm@hotmail.com"}
                </p>
                <p className="text-xs text-black">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  User ID: {(session as any)?.user?.id || (session as any)?.sub || "441862265"}
                </p>
              </div>
            </div>

            {/* Session Data */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-black mb-2">Session Information</h3>
              <div className="space-y-2 text-sm">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <p className="text-black"><span className="font-medium">User ID:</span> {(session as any)?.user?.id || (session as any)?.sub || "Not available"}</p>
                <p className="text-black"><span className="font-medium">Access Token:</span> {session.accessToken ? "✅ Present" : "❌ Missing"}</p>
                {session.error && (
                  <p className="text-red-600"><span className="font-medium">Error:</span> {session.error}</p>
                )}
              </div>
            </div>

            {/* Raw Session Data */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-black mb-2">Raw Session Data</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>

            {/* Test API Buttons */}
            <div className="pt-4 space-y-3">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/check-scopes");
                    const data = await response.json();
                    alert(JSON.stringify(data, null, 2));
                  } catch (error) {
                    alert("Error checking scopes: " + error);
                  }
                }}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition-colors mb-3"
              >
                Check Current Scopes
              </button>

              <button
                onClick={() => {
                  // Force re-authentication to get new scopes
                  signOut({ callbackUrl: '/auth/signin' });
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors mb-3"
              >
                Re-authenticate (Get New Scopes)
              </button>

              <button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/test-user-info");
                    const data = await response.json();
                    alert(JSON.stringify(data, null, 2));
                  } catch (error) {
                    alert("Error testing API: " + error);
                  }
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Test User Info API
              </button>
              
              <button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/check-follow");
                    const data = await response.json();
                    if (data.isFollowing) {
                      alert(`✅ ${data.message}`);
                    } else {
                      alert(`❌ ${data.message}`);
                    }
                  } catch (error) {
                    alert("Error checking follow status: " + error);
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors mb-3"
              >
                Check if Following BuckFoozle
              </button>
              
              <button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/check-tier3");
                    const data = await response.json();
                    if (data.isTier3) {
                      alert("🎉 You are a Tier 3 subscriber! You have access to the form.");
                    } else {
                      alert(`❌ ${data.message}`);
                    }
                  } catch (error) {
                    alert("Error checking subscription: " + error);
                  }
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Check BuckFoozle Tier 3 Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
