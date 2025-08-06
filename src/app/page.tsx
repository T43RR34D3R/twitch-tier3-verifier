"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface HomeSection {
  id: string;
  type: 'hero' | 'about' | 'tools' | 'twitch-embed' | 'custom';
  title: string;
  isEnabled: boolean;
  orderIndex: number;
  content: {
    heroTitle?: string;
    heroSubtitle?: string;
    heroImage?: string;
    heroButtons?: Array<{ label: string; url: string; style: 'primary' | 'secondary' }>;
    aboutTitle?: string;
    aboutText?: string;
    aboutImage?: string;
    aboutImagePosition?: 'left' | 'right';
    toolsTitle?: string;
    showToolCards?: boolean;
    twitchChannel?: string;
    embedType?: 'player' | 'chat' | 'both';
    customHtml?: string;
    customCss?: string;
  };
}

interface CustomizationSettings {
  siteTitle: string;
  siteLogo: string;
  logoType: 'emoji' | 'image' | 'text';
  logoImageUrl?: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  surfaceColor: string;
  backgroundType: 'gradient' | 'image' | 'solid';
  backgroundValue: string;
  headerStyle: 'glass' | 'solid' | 'minimal';
  showLogo: boolean;
  logoPosition: 'left' | 'center' | 'right';
  showHamburger: boolean;
  hamburgerPosition: 'left' | 'right';
  showAuthButtons: boolean;
  taglineAlignment: 'left' | 'center' | 'right';
}

const defaultHomeSections: HomeSection[] = [
  {
    id: "hero",
    type: "hero",
    title: "Hero Section",
    isEnabled: true,
    orderIndex: 1,
    content: {
      heroTitle: "Welcome to BuckFoozle Toolkit",
      heroSubtitle: "Professional streaming tools for content creators",
      heroImage: "",
      heroButtons: [
        { label: "Get Started", url: "/t3verify", style: "primary" },
        { label: "Learn More", url: "#about", style: "secondary" }
      ]
    }
  },
  {
    id: "about",
    type: "about",
    title: "About Buck",
    isEnabled: true,
    orderIndex: 2,
    content: {
      aboutTitle: "Meet BuckFoozle",
      aboutText: "Professional streamer and content creator bringing you the best streaming tools and entertainment.",
      aboutImage: "/buckfoozle-profile.jpg",
      aboutImagePosition: "left"
    }
  },
  {
    id: "twitch",
    type: "twitch-embed",
    title: "Twitch Stream",
    isEnabled: true,
    orderIndex: 3,
    content: {
      twitchChannel: "buckfoozle",
      embedType: "both"
    }
  },
  {
    id: "tools",
    type: "tools",
    title: "Available Tools",
    isEnabled: true,
    orderIndex: 4,
    content: {
      toolsTitle: "Streaming Tools",
      showToolCards: true
    }
  }
];

const defaultSettings: CustomizationSettings = {
  siteTitle: "BuckFoozle Toolkit",
  siteLogo: "🎮",
  logoType: "emoji",
  tagline: "Professional Streaming Tools",
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6", 
  accentColor: "#f59e0b",
  textColor: "#ffffff",
  surfaceColor: "#1e293b",
  backgroundType: "gradient",
  backgroundValue: "linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #1e293b 75%, #0f172a 100%)",
  headerStyle: "glass",
  showLogo: true,
  logoPosition: "center",
  showHamburger: true,
  hamburgerPosition: "left",
  showAuthButtons: true,
  taglineAlignment: "left",
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState("");
  const [homeSections, setHomeSections] = useState<HomeSection[]>(defaultHomeSections);
  const [settings, setSettings] = useState<CustomizationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const fullText = "Hello, World! Welcome to BuckFoozle's Toolkit! 🎮✨";

  useEffect(() => {
    setMounted(true);
    loadCustomizations();
    
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

  const loadCustomizations = async () => {
    try {
      const response = await fetch('/api/customization-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) setSettings({ ...defaultSettings, ...data.settings });
        if (data.homeSections) setHomeSections(data.homeSections);
      }
    } catch (error) {
      console.log('Using default settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const renderHeroSection = (section: HomeSection) => (
    <section key={section.id} className="mb-16 text-center">
      <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 min-h-[2em] flex items-center justify-center">
        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
          {section.content.heroTitle || text}
          <span className="animate-blink">|</span>
        </span>
      </h1>
      <p className="text-xl md:text-2xl text-gray-300 mb-8">
        {section.content.heroSubtitle || "Your one-stop toolkit for subathon streams, T3 verification, voting, and more!"}
      </p>
      {section.content.heroButtons && section.content.heroButtons.length > 0 && (
        <div className="flex flex-wrap gap-4 justify-center">
          {section.content.heroButtons.map((button, index) => (
            <Link
              key={index}
              href={button.url}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                button.style === 'primary'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              {button.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  );

  const renderAboutSection = (section: HomeSection) => (
    <section key={section.id} id="about" className="mb-16">
      <div className={`grid md:grid-cols-2 gap-8 items-center ${
        section.content.aboutImagePosition === 'right' ? 'md:grid-cols-2' : ''
      }`}>
        <div className={section.content.aboutImagePosition === 'right' ? 'order-2' : 'order-1'}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {section.content.aboutTitle || "Meet BuckFoozle"}
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            {section.content.aboutText || "Professional streamer and content creator bringing you the best streaming tools and entertainment."}
          </p>
        </div>
        {section.content.aboutImage && (
          <div className={`flex justify-center ${section.content.aboutImagePosition === 'right' ? 'order-1' : 'order-2'}`}>
            <img
              src={section.content.aboutImage}
              alt="Profile"
              className="w-64 h-64 rounded-full object-cover border-4 border-white/20"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </section>
  );

  const renderTwitchEmbed = (section: HomeSection) => (
    <section key={section.id} className="mb-16">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
        {section.title}
      </h2>
      <div className={`grid gap-6 ${
        section.content.embedType === 'both' ? 'md:grid-cols-2' : 'grid-cols-1'
      }`}>
        {(section.content.embedType === 'player' || section.content.embedType === 'both') && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Live Stream</h3>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={`https://player.twitch.tv/?channel=${section.content.twitchChannel}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`}
                height="100%"
                width="100%"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        )}
        {(section.content.embedType === 'chat' || section.content.embedType === 'both') && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Chat</h3>
            <div className="h-96 bg-black rounded-lg overflow-hidden">
              <iframe
                src={`https://www.twitch.tv/embed/${section.content.twitchChannel}/chat?parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`}
                height="100%"
                width="100%"
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  const renderToolsSection = (section: HomeSection) => (
    <section key={section.id} className="mb-16">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
        {section.content.toolsTitle || section.title}
      </h2>
      {section.content.showToolCards && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/t3verify" className="group">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400 transition-all duration-300 hover:scale-105 hover:bg-white/20">
              <div className="text-4xl mb-4">👑</div>
              <h3 className="text-xl font-bold text-white mb-2">T3 Verification</h3>
              <p className="text-gray-300">Verify your Tier 3 subscription and submit custom cheer info</p>
            </div>
          </Link>
          <Link href="/subathon-timer" className="group">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:bg-white/20">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-xl font-bold text-white mb-2">Subathon Timer</h3>
              <p className="text-gray-300">Control and manage the subathon countdown timer</p>
            </div>
          </Link>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 opacity-75">
            <div className="text-4xl mb-4">🗳️</div>
            <h3 className="text-xl font-bold text-white mb-2">Game Voting</h3>
            <p className="text-gray-300">Vote for games to play during the subathon</p>
            <span className="inline-block bg-purple-600 text-white text-xs px-2 py-1 rounded-full mt-2">Comming Soon</span>
          </div>
          <Link href="/analytics" className="group">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-green-400 transition-all duration-300 hover:scale-105 hover:bg-white/20">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-2">Analytics</h3>
              <p className="text-gray-300">View stream analytics and insights</p>
            </div>
          </Link>
          <Link href="/minecraft-auth" className="group">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-yellow-400 transition-all duration-300 hover:scale-105 hover:bg-white/20">
              <div className="text-4xl mb-4">⛏️</div>
              <h3 className="text-xl font-bold text-white mb-2">Minecraft Link</h3>
              <p className="text-gray-300">Link your Minecraft account with Twitch</p>
            </div>
          </Link>
          <Link href="/admin" className="group">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-red-400 transition-all duration-300 hover:scale-105 hover:bg-white/20">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-bold text-white mb-2">Admin Panel</h3>
              <p className="text-gray-300">Manage settings and configurations</p>
            </div>
          </Link>
        </div>
      )}
    </section>
  );

  const renderSection = (section: HomeSection) => {
    if (!section.isEnabled) return null;

    switch (section.type) {
      case 'hero':
        return renderHeroSection(section);
      case 'about':
        return renderAboutSection(section);
      case 'twitch-embed':
        return renderTwitchEmbed(section);
      case 'tools':
        return renderToolsSection(section);
      default:
        return null;
    }
  };

  const backgroundStyle = settings.backgroundType === 'gradient' 
    ? { background: settings.backgroundValue }
    : settings.backgroundType === 'solid'
    ? { backgroundColor: settings.backgroundValue }
    : settings.backgroundType === 'image'
    ? { backgroundImage: `url(${settings.backgroundValue})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" 
      style={backgroundStyle}
    >
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
      <div className="max-w-6xl w-full relative z-10">
        {/* Render dynamic sections */}
        {homeSections
          .filter(section => section.isEnabled)
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map(renderSection)}

        {/* Footer */}
        <div className="text-gray-400 text-sm text-center mt-16">
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
