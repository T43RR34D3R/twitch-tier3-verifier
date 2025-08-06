"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import ProgressIndicator from "../../components/ProgressIndicator";

interface PageTexts {
  title: string;
  subtitle: string;
  signInText: string;
  steps: string[];
  redirectUrl?: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [pageTexts, setPageTexts] = useState<PageTexts | null>(null);
  const [pageTextsLoaded, setPageTextsLoaded] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);

  // Load page texts from database
  useEffect(() => {
    const loadPageTexts = async () => {
      try {
        const response = await fetch('/api/page-settings', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setPageTexts({
              title: data.settings.title,
              subtitle: data.settings.subtitle,
              signInText: data.settings.sign_in_text,
              steps: data.settings.steps,
              redirectUrl: data.settings.redirect_url_1 || data.settings.redirect_url
            });
          } else {
            // Use defaults if no settings found
            setPageTexts({
              title: "Tier 3 Toolkit",
              subtitle: "Verify your Tier 3 subscription to submit info for your custom T3 cheer!",
              signInText: "Please sign in with your Twitch account to verify your subscription status.",
              steps: ["Signed In", "Verifying Account", "Checking Tier 3", "Verified"]
            });
          }
        } else {
          // Use defaults if API call fails
          setPageTexts({
            title: "Tier 3 Toolkit",
            subtitle: "Verify your Tier 3 subscription to submit info for your custom T3 cheer!",
            signInText: "Please sign in with your Twitch account to verify your subscription status.",
            steps: ["Signed In", "Verifying Account", "Checking Tier 3", "Verified"]
          });
        }
      } catch (error) {
        console.error('Error loading page settings:', error);
        // Use defaults if error occurs
        setPageTexts({
          title: "Tier 3 Toolkit",
          subtitle: "Verify your Tier 3 subscription to submit info for your custom T3 cheer!",
          signInText: "Please sign in with your Twitch account to verify your subscription status.",
          steps: ["Signed In", "Verifying Account", "Checking Tier 3", "Verified"]
        });
      } finally {
        setPageTextsLoaded(true);
      }
    };
    loadPageTexts();
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      // Clear any existing state when user is signed out
      setMessage("");
      setCurrentStep(0);
      setIsChecking(false);
      setHasVerified(false);  // Reset verification flag
      return;
    }

    // Check if there's a token refresh error
    if (session.error === "RefreshAccessTokenError") {
      setMessage("Your session has expired. Please sign in again.");
      setTimeout(() => {
        signOut({ redirect: false }).then(() => {
          window.location.reload();
        });
      }, 2000);
      return;
    }

    // Only proceed with verification if user is actually authenticated
    if (status !== "authenticated") {
      return;
    }

    // Prevent multiple verification attempts for the same session
    if (hasVerified) {
      return;
    }

    // Set a flag to indicate that verification has started
    setHasVerified(true);

    // Check follow status first (for testing)
    setIsChecking(true);
    setCurrentStep(1);
    let verificationSuccessful = false;
    
    fetch("/api/check-follow")
      .then((res) => res.json())
      .then((data) => {
        // Check if we need to force re-authentication
        if (data.forceReauth) {
          setMessage("Your session has expired. Signing you out...");
          setTimeout(() => {
            signOut({ redirect: false }).then(() => {
              window.location.reload();
            });
          }, 2000);
          return;
        }
        
        if (data.isFollowing) {
          setMessage(data.message || "Account verified! Now checking Tier 3 subscription...");
          setCurrentStep(2);
          // Move to subscription check
          return fetch("/api/check-tier3");
        } else {
          setMessage(data.message || "Verification failed. Please try again.");
          throw new Error("Verification failed");
        }
      })
      .then((res) => res?.json())
      .then((data) => {
        if (data?.isTier3) {
          setMessage("Tier 3 subscription verified! Redirecting to form...");
          setCurrentStep(3);
          verificationSuccessful = true;
          setTimeout(() => {
            // Redirect to embedded form page instead of external URL
            window.location.href = "/tier3-form";
          }, 2000);
        } else {
          setMessage(data?.message || "You need to be a Tier 3 subscriber to access this form.");
        }
      })
      .catch((error) => {
        console.error("Error checking subscription:", error);
        setMessage("Error checking subscription status. Please try again.");
      })
      .finally(() => {
        setIsChecking(false);
        // Only reset progress bar if verification failed
        if (!verificationSuccessful) {
          setCurrentStep(0);
        }
      });
  }, [session, status, hasVerified, pageTexts?.redirectUrl]);

  const handleSignIn = () => {
    signIn("twitch");
  };

  // Show loading state until page texts are loaded
  if (!pageTextsLoaded) {
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
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl drop-shadow-2xl p-4 sm:p-8 text-center relative z-10 mx-4">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 bg-purple-600 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-purple-600 rounded-full animate-pulse" style={{animationDelay: "0.2s"}}></div>
            <div className="w-4 h-4 bg-purple-600 rounded-full animate-pulse" style={{animationDelay: "0.4s"}}></div>
            <span className="text-black ml-2">Loading...</span>
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
      
      {/* Persistent Sign Out Button */}
      {session && (
        <button
          onClick={() => signOut()}
          className="absolute top-4 right-4 z-20 bg-white/90 hover:bg-white text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors shadow-lg"
        >
          Sign Out
        </button>
      )}
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl drop-shadow-2xl p-4 sm:p-8 text-center relative z-10 mx-4">
        <div className="mb-8">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">
            {pageTexts?.title}
          </h1>
          <p className="text-black">
            {pageTexts?.subtitle}
          </p>
        </div>

        {status === "loading" && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 bg-purple-600 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-purple-600 rounded-full animate-pulse" style={{animationDelay: "0.2s"}}></div>
            <div className="w-4 h-4 bg-purple-600 rounded-full animate-pulse" style={{animationDelay: "0.4s"}}></div>
            <span className="text-black ml-2">Loading...</span>
          </div>
        )}

        {!session && status !== "loading" && (
          <div>
            <p className="text-black mb-6">
              {pageTexts?.signInText}
            </p>
            <button
              onClick={handleSignIn}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
              </svg>
              <span>Sign in with Twitch</span>
            </button>
          </div>
        )}

        {session && (
          <div>
            <div className="mb-6">
              <Image
                src={session.user?.image || "/default-avatar.png"}
                alt={session.user?.name || "User"}
                width={64}
                height={64}
                className="rounded-full mx-auto mb-2"
              />
              <p className="text-black font-medium">
                Welcome, {session.user?.name}!
              </p>
            </div>
            
            {/* Progress Indicator */}
            <ProgressIndicator
              currentStep={currentStep}
              steps={pageTexts?.steps || []}
            />

            {isChecking && (
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-4 h-4 bg-purple-600 rounded-full animate-spin"></div>
                <span className="text-black">Checking subscription status...</span>
              </div>
            )}

            {message && (
              <div>
                <div className={`p-4 rounded-lg mb-4 ${
                  message.includes("verified") || message.includes("confirmed") 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {message}
                </div>
                {/* Show sign out button when verification fails */}
                {!message.includes("verified") && !message.includes("confirmed") && !message.includes("checking") && (
                  <button
                    onClick={() => signOut()}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors mt-2"
                  >
                    Sign Out & Try Different Account
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
