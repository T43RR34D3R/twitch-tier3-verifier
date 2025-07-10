"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function SignIn() {
  const [providers, setProviders] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const res = await getProviders();
      setProviders(res);
    })();
  }, []);

  if (!providers) {
    return <div className="flex justify-center items-center min-h-screen text-gray-800">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background with blur */}
      <div className="absolute inset-0 bg-purple-900 bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url(/buckfoozle-bg.png)', filter: 'blur(3px)'}}></div>
      {/* Gradient overlay - darker at top */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/15"></div>
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center relative z-10" style={{filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))'}}>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Sign in to continue</h1>
        
        {Object.values(providers).map((provider: any) => (
          <div key={provider.name}>
            <button
              onClick={() => signIn(provider.id)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
              </svg>
              <span>Sign in with {provider.name}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
