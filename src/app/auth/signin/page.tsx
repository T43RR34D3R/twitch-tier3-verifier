"use client";

import { getProviders, signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SignInContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [providers, setProviders] = useState<Record<string, any> | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getProviders();
      setProviders(res);
    })();
  }, []);

  // Note: Let NextAuth handle the redirect naturally
  // Only show the signin form if the user is not already authenticated

  // Clear any existing session that might have errors
  useEffect(() => {
    if (status === "authenticated" && session?.error === "RefreshAccessTokenError") {
      setIsClearing(true);
      signOut({ redirect: false }).then(() => {
        setIsClearing(false);
      });
    }
  }, [session, status]);

  // Show loading if we don't have providers yet or if we're redirecting authenticated users
  if (!providers || (status === "authenticated" && session && !session.error && !isClearing)) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
          <div className="text-xl">
            {status === "authenticated" ? "Redirecting..." : "Loading..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
      {/* Backdrop blur and vignette overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div 
        className="absolute inset-0" 
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 100%)'
        }}
      ></div>
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl drop-shadow-2xl p-8 text-center relative z-10">
        <h1 className="text-2xl font-bold text-black mb-6">Sign in to continue</h1>
        
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {Object.values(providers).map((provider: any) => (
          <div key={provider.name} className="space-y-3">
            <button
              onClick={() => {
                const callbackUrl = searchParams?.get('callbackUrl') || '/';
                signIn(provider.id, { callbackUrl });
              }}
              disabled={isClearing}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
              </svg>
              <span>{isClearing ? 'Clearing Session...' : `Sign in with ${provider.name}`}</span>
            </button>
            
            {/* Clear Session Button for users stuck in sign-in loop */}
            {status === "authenticated" && session?.error && (
              <button
                onClick={() => {
                  setIsClearing(true);
                  signOut({ redirect: false }).then(() => {
                    setIsClearing(false);
                    window.location.reload();
                  });
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Clear Session & Try Again
              </button>
            )}
          </div>
        ))}
        
        {/* Show error message if user has session errors */}
        {status === "authenticated" && session?.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              Session error detected. Please clear your session and try signing in again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen text-gray-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
