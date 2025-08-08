"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format, startOfWeek, addDays, isSameDay, endOfWeek } from "date-fns";
import MerchPanel from "../components/MerchPanel";

interface CalendarEvent {
  id: number;
  date: string;
  title: string;
  description?: string;
  image_url?: string;
  background_color: string;
  text_color: string;
  is_all_day: boolean;
  start_time?: string;
  end_time?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface HomeSection {
  id: string;
  type: 'hero' | 'about' | 'tools' | 'twitch-embed' | 'social' | 'custom';
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
    socialTitle?: string;
    showSocialCards?: boolean;
    socialLinks?: Array<{ platform: string; url: string; icon: string; color: string }>;
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
  footerText?: string;
  footerLinkText?: string;
  footerLinkUrl?: string;
}

const defaultHomeSections: HomeSection[] = [
          {
            id: "hero",
            type: "hero",
            title: "Hero Section",
            isEnabled: true,
            orderIndex: 1,
            content: {
              heroTitle: "Welcome to BuckFoozle's World",
              heroSubtitle: "Join me for variety gaming, laughs, and an awesome community!",
              heroImage: "",
              heroButtons: [
                { label: "Watch Live", url: "https://twitch.tv/buckfoozle", style: "primary" },
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
              aboutText: "Hey there! I'm Buck, a variety streamer who loves gaming, building community, and having a great time with viewers. From indie gems to AAA titles, horror games to cozy adventures - there's always something fun happening on stream. Come hang out and be part of the BuckFoozle family!",
              aboutImage: "https://static-cdn.jtvnw.net/jtv_user_pictures/269aa1a9-be77-4d9a-9f6e-abfb1ed1c493-profile_image-300x300.png",
              aboutImagePosition: "left"
            }
          },
          {
            id: "twitch",
            type: "twitch-embed",
            title: "Watch Live",
            isEnabled: true,
            orderIndex: 3,
            content: {
              twitchChannel: "buckfoozle",
              embedType: "player"
            }
          },
          {
            id: "social",
            type: "social",
            title: "Connect With Me",
            isEnabled: true,
            orderIndex: 4,
            content: {
              socialTitle: "Follow Me Everywhere",
              showSocialCards: true,
              socialLinks: [
                { platform: "Twitch", url: "https://twitch.tv/buckfoozle", icon: "📺", color: "#9146ff" },
                { platform: "Discord", url: "https://discord.gg/buckfoozle", icon: "💬", color: "#5865f2" },
                { platform: "Twitter", url: "https://twitter.com/buckfoozle", icon: "🐦", color: "#1da1f2" },
                { platform: "YouTube", url: "https://youtube.com/@buckfoozle", icon: "📹", color: "#ff0000" }
              ]
            }
          }
];

const defaultSettings: CustomizationSettings = {
  siteTitle: "BuckFoozle",
  siteLogo: "👑",
  logoType: "emoji",
  tagline: "Variety Streamer & Content Creator",
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
  footerText: "Made with 💜 for the Best Friends Club",
  footerLinkText: "twitch.tv/buckfoozle",
  footerLinkUrl: "https://twitch.tv/buckfoozle",
};

// Check if user is admin
const isUserAdmin = (session: { user?: { name?: string | null; id?: string } } | null) => {
  if (!session?.user) return false;
  const adminUsers = ["TearReader", "BuckFoozle"];
  const adminIds = ["1239758967", "269187200"];
  
  return adminUsers.some(admin => 
    admin.toLowerCase() === (session.user?.name || "").toLowerCase()
  ) || adminIds.includes(session.user?.id || "");
};

export default function Home() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState("");
  const [homeSections, setHomeSections] = useState<HomeSection[]>([]);
  const [settings, setSettings] = useState<CustomizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const fullText = "Hello, World! Welcome to BuckFoozle's Toolkit! 🎮✨";

  useEffect(() => {
    setMounted(true);
    loadCustomizations();
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const today = new Date();
      const weekStart = startOfWeek(today);
      const weekEnd = endOfWeek(today);
      
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      
      const response = await fetch(`/api/calendar?month=${month}&year=${year}`);
      const data = await response.json();
      
      if (response.ok) {
        // Filter events to just this week
        const weekEvents = data.events?.filter((event: CalendarEvent) => {
          const eventDate = new Date(event.date);
          return eventDate >= weekStart && eventDate <= weekEnd;
        }) || [];
        setEvents(weekEvents);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  // Weekly Calendar Widget Component
  const WeeklyCalendarWidget = () => {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const getEventsForDate = (date: Date) => {
      return events.filter(event => 
        isSameDay(new Date(event.date), date)
      );
    };

    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400 transition-all duration-300 hover:bg-white/15">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">📅 This Week</h3>
            <p className="text-sm text-gray-300">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </p>
          </div>
          <Link 
            href="/calendar" 
            className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
          >
            View Full Calendar →
          </Link>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isToday = isSameDay(day, today);
            const backgroundEvent = dayEvents.find(event => event.image_url && event.image_url.trim() !== '');
            
            return (
              <div key={day.toISOString()} className="min-h-[80px] relative">
                {/* Day header */}
                <div className={`text-center text-xs font-medium mb-2 ${
                  isToday ? 'text-purple-300' : 'text-gray-400'
                }`}>
                  {format(day, 'EEE')}
                </div>
                
                {/* Day content */}
                <div className={`min-h-[60px] rounded-lg border overflow-hidden relative transition-all ${
                  isToday 
                    ? 'border-purple-400 bg-purple-900/20'
                    : backgroundEvent?.image_url
                    ? 'border-white/30'
                    : 'border-white/10 bg-white/5'
                }`}>
                  {/* Background image */}
                  {backgroundEvent?.image_url && (
                    <>
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${backgroundEvent.image_url})`
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40" />
                    </>
                  )}
                  
                  {/* Day number and events */}
                  <div className="relative h-full p-2">
                    <div className={`text-sm font-bold mb-1 ${
                      backgroundEvent?.image_url
                        ? 'text-white drop-shadow-lg'
                        : isToday
                        ? 'text-purple-300'
                        : 'text-gray-300'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* Event indicators */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs px-1 py-0.5 rounded truncate ${
                            backgroundEvent?.image_url
                              ? 'bg-white/20 text-white backdrop-blur-sm'
                              : 'text-white'
                          }`}
                          style={{
                            backgroundColor: backgroundEvent?.image_url ? undefined : event.background_color + '80',
                            fontSize: '10px',
                            lineHeight: '12px'
                          }}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className={`text-xs ${
                          backgroundEvent?.image_url ? 'text-white/80' : 'text-gray-400'
                        }`}>
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!loading && settings) {
      // Start typewriter effect only after content is loaded
      let index = 0;
      const timer = setInterval(() => {
        setText(fullText.slice(0, index));
        index++;
        if (index > fullText.length) {
          clearInterval(timer);
        }
      }, 50);

      return () => clearInterval(timer);
    }
  }, [loading, settings]);

  const loadCustomizations = async () => {
    try {
      const response = await fetch('/api/customization-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...(data.settings || {}) });
        setHomeSections(data.homeSections || defaultHomeSections);
      } else {
        // If API fails, use defaults
        setSettings(defaultSettings);
        setHomeSections(defaultHomeSections);
      }
    } catch (error) {
      console.log('Using default settings:', error);
      // If fetch fails, use defaults
      setSettings(defaultSettings);
      setHomeSections(defaultHomeSections);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
          <div className="text-white text-xl">Loading BuckFoozle&apos;s World...</div>
        </div>
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
            <span className="inline-block bg-purple-600 text-white text-xs px-2 py-1 rounded-full mt-2">Coming Soon</span>
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
          <div className="md:col-span-2 lg:col-span-3">
            <WeeklyCalendarWidget />
          </div>
          
          {isUserAdmin(session) && (
            <Link href="/admin" className="group">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-red-400 transition-all duration-300 hover:scale-105 hover:bg-white/20">
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-xl font-bold text-white mb-2">Admin Panel</h3>
                <p className="text-gray-300">Manage settings and configurations</p>
              </div>
            </Link>
          )}
        </div>
      )}
    </section>
  );

  const renderSocialSection = (section: HomeSection) => (
    <section key={section.id} className="mb-16">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
        {section.content.socialTitle || section.title}
      </h2>
      {section.content.showSocialCards && section.content.socialLinks && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {section.content.socialLinks.map((social, index) => (
            <a
              key={index}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div 
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-opacity-50 transition-all duration-300 hover:scale-105 hover:bg-white/20 text-center"
                style={{
                  '--hover-color': social.color,
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = social.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                <div className="text-4xl mb-4">{social.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{social.platform}</h3>
                <p className="text-gray-300 text-sm">Follow me on {social.platform}</p>
              </div>
            </a>
          ))}
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
      case 'social':
        return renderSocialSection(section);
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

      {/* Main content */}
      <div className="max-w-6xl w-full relative z-10">
        {/* Render dynamic sections */}
        {homeSections
          .filter(section => section.isEnabled)
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map(renderSection)}

        {/* Merch Panel */}
        <MerchPanel isAdmin={isUserAdmin(session)} />

        {/* Footer */}
        <div className="text-gray-400 text-sm text-center mt-16">
          <p>{settings.footerText || "Made with 💜 for the Best Friends Club"}</p>
          <p className="mt-2">
            <a 
              href={settings.footerLinkUrl || "https://twitch.tv/buckfoozle"} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              {settings.footerLinkText || "twitch.tv/buckfoozle"}
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
