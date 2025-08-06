"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Tier3FormPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      // Redirect to verification page if not signed in
      router.push("/t3verify");
      return;
    }

    // Verify the user is actually Tier 3 before showing the form
    const verifyTier3 = async () => {
      try {
        const response = await fetch("/api/check-tier3");
        const data = await response.json();
        
        if (data.isTier3) {
          setIsVerified(true);
        } else {
          // Not Tier 3, redirect back to verification
          router.push("/t3verify");
        }
      } catch (error) {
        console.error("Error verifying Tier 3 status:", error);
        router.push("/t3verify");
      } finally {
        setIsChecking(false);
      }
    };

    verifyTier3();
  }, [session, status, router]);

  if (status === "loading" || isChecking) {
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
            <span className="text-black ml-2">Verifying access...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat relative" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
      {/* Backdrop blur overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white/95 backdrop-blur-sm rounded-t-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-black mb-2">Tier 3 Custom Cheer Form</h1>
            <p className="text-gray-700 mb-4">Welcome {session?.user?.name}! Fill out the form below to submit your custom T3 cheer request.</p>
            
            {/* Navigation buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                ← Back to Home
              </button>
              <button
                onClick={() => router.push("/t3verify")}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                ← Back to Verification
              </button>
            </div>
          </div>

          {/* Embedded Notion Form */}
          <div className="bg-white/95 backdrop-blur-sm rounded-b-xl shadow-lg overflow-hidden">
            <iframe 
              src="https://expensive-battery-1ef.notion.site/ebd/22baab23c4af80a593a8de32f464a191" 
              width="100%" 
              height="800" 
              frameBorder="0" 
              allowFullScreen
              className="w-full"
              title="Tier 3 Custom Cheer Form"
            />
          </div>

          {/* Footer note */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 mt-4 text-center">
            <p className="text-sm text-gray-600">
              Having trouble with the form? You can also access it directly at{' '}
              <a 
                href="https://expensive-battery-1ef.notion.site/22baab23c4af80a593a8de32f464a191?pvs=105" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 underline"
              >
                this link
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
