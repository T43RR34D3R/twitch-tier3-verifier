"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import ProgressIndicator from "../components/ProgressIndicator";

export default function Home() {
  const { data: session, status } = useSession();
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      // Don't auto-sign in, let user click the button
      return;
    }

    // Check follow status first (for testing)
    setIsChecking(true);
    setCurrentStep(1);
    let verificationSuccessful = false;
    
    fetch("/api/check-follow")
      .then((res) => res.json())
      .then((data) => {
        if (data.isFollowing) {
          setMessage("Following confirmed! Now checking Tier 3 subscription...");
          setCurrentStep(2);
          // If following, then check subscription
          return fetch("/api/check-tier3");
        } else {
          setMessage(data.message || "You need to follow the channel first.");
          throw new Error("Not following");
        }
      })
      .then((res) => res?.json())
      .then((data) => {
        if (data?.isTier3) {
          setMessage("Tier 3 subscription verified! Redirecting to form...");
          setCurrentStep(3);
          verificationSuccessful = true;
          setTimeout(() => {
            window.location.href = process.env.NEXT_PUBLIC_NOTION_FORM_URL || "#";
          }, 3000);
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
  }, [session, status]);

  const handleSignIn = () => {
    signIn("twitch");
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
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl drop-shadow-2xl p-4 sm:p-8 text-center relative z-10 mx-4">
        <div className="mb-8">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">
            Tier 3 Verification
          </h1>
          <p className="text-black">
            Verify your Tier 3 subscription to submit info for your custom T3 cheer!
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
              Please sign in with your Twitch account to verify your subscription status.
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
              steps={["Signed In", "Checking Follow", "Checking Tier 3", "Verified"]}
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
