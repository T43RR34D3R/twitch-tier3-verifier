"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function TestPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p className="text-gray-800 p-4">Loading...</p>;

  if (session) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Authentication Test</h1>
        <div className="bg-green-100 p-4 rounded-lg mb-4">
          <p className="text-green-800">✅ Signed in as {session.user?.name}</p>
          <p className="text-green-800">Email: {session.user?.email}</p>
          <p className="text-green-800">Access Token: {session.accessToken ? "✅ Present" : "❌ Missing"}</p>
          {session.error && <p className="text-red-600">Error: {session.error}</p>}
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => signOut()}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign out
          </button>
          
          <div>
            <button
              onClick={async () => {
                const response = await fetch("/api/check-tier3");
                const data = await response.json();
                alert(JSON.stringify(data, null, 2));
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Tier 3 Check API
            </button>
          </div>
        </div>
        
        <div className="mt-8 bg-gray-100 p-4 rounded-lg">
          <h3 className="font-bold mb-2 text-gray-800">Session Data:</h3>
          <pre className="text-sm overflow-auto text-gray-700">{JSON.stringify(session, null, 2)}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Authentication Test</h1>
      <p className="mb-4 text-gray-800">Not signed in</p>
      <button
        onClick={() => signIn("twitch")}
        className="bg-purple-600 text-white px-6 py-3 rounded hover:bg-purple-700"
      >
        Sign in with Twitch
      </button>
    </div>
  );
}
