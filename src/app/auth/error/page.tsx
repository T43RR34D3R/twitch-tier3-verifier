"use client";

import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error') || null;

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      case 'RefreshAccessTokenError':
        return 'Your session has expired. Please sign in again.';
      default:
        return 'An error occurred during authentication.';
    }
  };

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
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-black mb-4">Authentication Error</h1>
        
        <p className="text-gray-700 mb-6">
          {getErrorMessage(error)}
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => signIn('twitch')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
            <span>Try Again</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-800">Loading...</p>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
