'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';

interface AuthState {
  status: 'loading' | 'error' | 'signin' | 'completing' | 'success';
  message: string;
  authCode?: string;
  minecraftUsername?: string;
}

function MinecraftAuthContent() {
  const searchParams = useSearchParams();
  const [authState, setAuthState] = useState<AuthState>({
    status: 'loading',
    message: 'Loading...'
  });

  useEffect(() => {
    if (!searchParams) return;
    
    const code = searchParams.get('code');
    const minecraft = searchParams.get('minecraft');

    if (!code || !minecraft) {
      setAuthState({
        status: 'error',
        message: 'Invalid authorization link. Please try again from Minecraft.'
      });
      return;
    }

    setAuthState({
      status: 'signin',
      message: 'Please sign in with your Twitch account to link it to your Minecraft account.',
      authCode: code,
      minecraftUsername: minecraft
    });
  }, [searchParams]);

  const handleTwitchSignIn = async () => {
    try {
      setAuthState(prev => ({
        ...prev,
        status: 'completing',
        message: 'Signing in with Twitch...'
      }));

      const result = await signIn('twitch', {
        callbackUrl: window.location.href,
        redirect: false
      });

      if (result?.error) {
        setAuthState({
          status: 'error',
          message: 'Failed to sign in with Twitch. Please try again.'
        });
        return;
      }

      // Check if we're now authenticated
      const session = await getSession();
      if (session?.user) {
        await completeAuthorization(session.user.name || session.user.id!);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setAuthState({
        status: 'error',
        message: 'An error occurred during sign in. Please try again.'
      });
    }
  };

  const completeAuthorization = useCallback(async (twitchUsername: string) => {
    try {
      setAuthState(prev => ({
        ...prev,
        status: 'completing',
        message: 'Completing authorization...'
      }));

      const response = await fetch('/api/minecraft/auth/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authCode: authState.authCode,
          twitchUsername: twitchUsername,
          minecraftUsername: authState.minecraftUsername
        }),
      });

      if (response.ok) {
        setAuthState({
          status: 'success',
          message: `Successfully linked your Twitch account (${twitchUsername}) to your Minecraft account (${authState.minecraftUsername})! You can now close this page and return to Minecraft.`
        });
      } else {
        const errorData = await response.json();
        setAuthState({
          status: 'error',
          message: errorData.error || 'Failed to complete authorization.'
        });
      }
    } catch (error) {
      console.error('Complete authorization error:', error);
      setAuthState({
        status: 'error',
        message: 'An error occurred while completing authorization.'
      });
    }
  }, [authState.authCode, authState.minecraftUsername]);

  // Check if user is already authenticated when component loads
  useEffect(() => {
    if (authState.status === 'signin' && authState.authCode) {
      getSession().then(session => {
        if (session?.user) {
          completeAuthorization(session.user.name || session.user.id!);
        }
      });
    }
  }, [authState.status, authState.authCode, completeAuthorization]);

  return (
    <div className="min-h-screen bg-[url('/background/skidlong0215.png')] bg-cover bg-center flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-2xl p-8 max-w-md w-full border border-white/20">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Minecraft x Twitch
          </h1>
          <p className="text-blue-200 mb-8">
            Link your accounts
          </p>

          <div className="space-y-6">
            {authState.status === 'loading' && (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="ml-3 text-white">{authState.message}</span>
              </div>
            )}

            {authState.status === 'signin' && (
              <>
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                  <p className="text-white text-sm">
                    <strong>Minecraft Username:</strong> {authState.minecraftUsername}
                  </p>
                </div>
                
                <p className="text-white/80 text-sm">
                  {authState.message}
                </p>

                <button
                  onClick={handleTwitchSignIn}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                  </svg>
                  <span>Sign in with Twitch</span>
                </button>
              </>
            )}

            {authState.status === 'completing' && (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="ml-3 text-white">{authState.message}</span>
              </div>
            )}

            {authState.status === 'success' && (
              <div className="text-center">
                <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 mb-4">
                  <svg className="w-8 h-8 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-white font-semibold">Success!</p>
                </div>
                <p className="text-white/80 text-sm">
                  {authState.message}
                </p>
              </div>
            )}

            {authState.status === 'error' && (
              <div className="text-center">
                <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 mb-4">
                  <svg className="w-8 h-8 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="text-white font-semibold">Error</p>
                </div>
                <p className="text-white/80 text-sm">
                  {authState.message}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MinecraftAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[url('/background/skidlong0215.png')] bg-cover bg-center flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-2xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-3 text-white">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    }>
      <MinecraftAuthContent />
    </Suspense>
  );
}
