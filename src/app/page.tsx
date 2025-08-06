"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState("");
  const fullText = "Hello, World! Welcome to BuckFoozle's Toolkit! 🎮✨";

  useEffect(() => {
    setMounted(true);
    
    // Typewriter effect
    let index = 0;
    const timer = setInterval(() => {
      setText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) {
        clearInterval(timer);
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="max-w-4xl w-full text-center relative z-10">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 min-h-[2em] flex items-center justify-center">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              {text}
              <span className="animate-blink">|</span>
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Your one-stop toolkit for subathon streams, T3 verification, voting, and more!
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* T3 Verification */}
          <Link href="/t3verify" className="group">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400 transition-all duration-300 hover:scale-105 hover:bg-white/20">
              <div className="text-4xl mb-4">👑</div>
              <h3 className="text-xl font-bold text-white mb-2">T3 Verification</h3>
              <p className="text-gray-300">Verify your Tier 3 subscription and submit custom cheer info</p>
            </div>
          </Link>

          {/* Subathon Timer */}
          <Link href="/subathon-timer" className="group">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:bg-white/20">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-xl font-bold text-white mb-2">Subathon Timer</h3>
              <p className="text-gray-300">Control and manage the subathon countdown timer</p>
            </div>
          </Link>

          {/* Game Voting (Coming Soon) */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 opacity-75">
            <div className="text-4xl mb-4">🗳️</div>
            <h3 className="text-xl font-bold text-white mb-2">Game Voting</h3>
            <p className="text-gray-300">Vote for games to play during the subathon</p>
            <span className="inline-block bg-purple-600 text-white text-xs px-2 py-1 rounded-full mt-2">
              Coming Soon
            </span>
          </div>

          {/* Analytics */}
          <Link href="/analytics" className="group">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-green-400 transition-all duration-300 hover:scale-105 hover:bg-white/20">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-2">Analytics</h3>
              <p className="text-gray-300">View stream analytics and insights</p>
            </div>
          </Link>

          {/* Minecraft Integration */}
          <Link href="/minecraft-auth" className="group">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-yellow-400 transition-all duration-300 hover:scale-105 hover:bg-white/20">
              <div className="text-4xl mb-4">⛏️</div>
              <h3 className="text-xl font-bold text-white mb-2">Minecraft Link</h3>
              <p className="text-gray-300">Link your Minecraft account with Twitch</p>
            </div>
          </Link>

          {/* Admin Panel */}
          <Link href="/admin" className="group">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-red-400 transition-all duration-300 hover:scale-105 hover:bg-white/20">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-bold text-white mb-2">Admin Panel</h3>
              <p className="text-gray-300">Manage settings and configurations</p>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-gray-400 text-sm">
          <p>Made with 💜 for the BuckFoozle community</p>
          <p className="mt-2">
            <a 
              href="https://twitch.tv/buckfoozle" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              twitch.tv/buckfoozle
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
      `}</style>
    </div>
  );
}
