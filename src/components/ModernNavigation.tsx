"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut, signIn } from "next-auth/react";
import { usePathname } from "next/navigation";

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
}

interface MenuItem {
  id: string;
  label: string;
  url: string;
  iconType: 'emoji' | 'icon' | 'image';
  iconValue: string;
  description?: string;
  visibility: 'all' | 'authenticated' | 'unauthenticated' | 'admin';
  isExternal: boolean;
  openInNewTab: boolean;
  orderIndex: number;
  isEnabled: boolean;
}

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
};

const defaultMenuItems: MenuItem[] = [
  { id: "1", label: "Home", url: "/", iconType: "emoji", iconValue: "🏠", visibility: "all", isExternal: false, openInNewTab: false, orderIndex: 1, isEnabled: true },
  { id: "2", label: "T3 Verification", url: "/t3verify", iconType: "emoji", iconValue: "👑", visibility: "all", isExternal: false, openInNewTab: false, orderIndex: 2, isEnabled: true },
  { id: "3", label: "Subathon Timer", url: "/subathon-timer", iconType: "emoji", iconValue: "⏰", visibility: "all", isExternal: false, openInNewTab: false, orderIndex: 3, isEnabled: true },
  { id: "4", label: "Analytics", url: "/analytics", iconType: "emoji", iconValue: "📊", visibility: "authenticated", isExternal: false, openInNewTab: false, orderIndex: 4, isEnabled: true },
  { id: "5", label: "Admin Panel", url: "/admin", iconType: "emoji", iconValue: "⚙️", visibility: "admin", isExternal: false, openInNewTab: false, orderIndex: 5, isEnabled: true },
  { id: "6", label: "Twitch Channel", url: "https://twitch.tv/buckfoozle", iconType: "emoji", iconValue: "💜", visibility: "all", isExternal: true, openInNewTab: true, orderIndex: 6, isEnabled: true },
];

// Check if user is admin
const isUserAdmin = (session: { user?: { name?: string | null; id?: string } } | null) => {
  if (!session?.user) return false;
  const adminUsers = ["TearReader", "BuckFoozle"];
  const adminIds = ["1239758967", "269187200"];
  
  return adminUsers.some(admin => 
    admin.toLowerCase() === (session.user?.name || "").toLowerCase()
  ) || adminIds.includes(session.user?.id || "");
};

export default function ModernNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settings, setSettings] = useState<CustomizationSettings>(defaultSettings);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(defaultMenuItems);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    loadCustomizationSettings();
  }, []);

  const loadCustomizationSettings = async () => {
    try {
      // Try to load from API, fallback to defaults
      const response = await fetch('/api/customization-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) setSettings({ ...defaultSettings, ...data.settings });
        if (data.menuItems) setMenuItems(data.menuItems);
      }
    } catch {
      console.log('Using default settings (API not available)');
      // Use defaults - this is fine for now
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const getBackgroundStyle = () => {
    switch (settings.backgroundType) {
      case 'gradient':
        return { background: settings.backgroundValue };
      case 'image':
        return { 
          backgroundImage: `url(${settings.backgroundValue})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      case 'solid':
        return { backgroundColor: settings.backgroundValue };
      default:
        return { background: settings.backgroundValue };
    }
  };

  const getHeaderClasses = () => {
    const base = "fixed top-0 left-0 right-0 z-50 transition-all duration-300";
    switch (settings.headerStyle) {
      case 'glass':
        return `${base} bg-black/10 backdrop-blur-xl border-b border-white/10 shadow-2xl`;
      case 'solid':
        return `${base} shadow-xl`;
      case 'minimal':
        return `${base} bg-transparent`;
      default:
        return `${base} bg-black/10 backdrop-blur-xl border-b border-white/10 shadow-2xl`;
    }
  };

  const getVisibleMenuItems = () => {
    return menuItems
      .filter(item => {
        if (!item.isEnabled) return false;
        
        switch (item.visibility) {
          case 'authenticated':
            return !!session;
          case 'unauthenticated':
            return !session;
          case 'admin':
            return isUserAdmin(session);
          case 'all':
          default:
            return true;
        }
      })
      .sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const renderLogo = () => {
    const logoContent = (() => {
      switch (settings.logoType) {
        case 'image':
          return settings.logoImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={settings.logoImageUrl} 
              alt={settings.siteTitle}
              className="h-8 w-8 object-contain"
            />
          ) : (
            <span className="text-2xl">{settings.siteLogo}</span>
          );
        case 'text':
          return (
            <span className="text-xl font-bold" style={{ color: settings.textColor }}>
              {settings.siteLogo}
            </span>
          );
        case 'emoji':
        default:
          return <span className="text-2xl">{settings.siteLogo}</span>;
      }
    })();

    return (
      <Link 
        href="/" 
        className="flex items-center space-x-3 hover:opacity-80 transition-opacity group"
        onClick={closeMenu}
      >
        <div className="transition-transform group-hover:scale-110">
          {logoContent}
        </div>
        <div className="hidden sm:flex flex-col">
          <span 
            className="text-xl font-bold leading-tight"
            style={{ color: settings.textColor }}
          >
            {settings.siteTitle}
          </span>
          {settings.tagline && (
            <span 
              className="text-xs opacity-70 leading-tight"
              style={{ color: settings.textColor }}
            >
              {settings.tagline}
            </span>
          )}
        </div>
      </Link>
    );
  };

  const renderMenuItem = (item: MenuItem) => {
    const content = (
      <div className={`
        flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300
        hover:bg-white/10 hover:backdrop-blur-sm hover:scale-105
        ${pathname === item.url ? 'bg-white/20 shadow-lg' : ''}
        group cursor-pointer
      `}>
        <span className="text-xl group-hover:scale-110 transition-transform">
          {item.iconValue}
        </span>
        <div className="flex flex-col">
          <span 
            className="font-medium"
            style={{ color: settings.textColor }}
          >
            {item.label}
          </span>
          {item.description && (
            <span 
              className="text-xs opacity-70"
              style={{ color: settings.textColor }}
            >
              {item.description}
            </span>
          )}
        </div>
      </div>
    );

    if (item.isExternal) {
      return (
        <a
          key={item.id}
          href={item.url}
          target={item.openInNewTab ? "_blank" : "_self"}
          rel={item.openInNewTab ? "noopener noreferrer" : ""}
          onClick={closeMenu}
        >
          {content}
        </a>
      );
    }

    return (
      <Link key={item.id} href={item.url} onClick={closeMenu}>
        {content}
      </Link>
    );
  };

  if (!mounted) return null;

  const visibleMenuItems = getVisibleMenuItems();

  return (
    <>
      {/* Background */}
      <div 
        className="fixed inset-0 -z-10" 
        style={getBackgroundStyle()}
      />
      
      {/* Overlay for extra depth */}
      <div className="fixed inset-0 -z-10 bg-black/20" />

      {/* Header */}
      <header 
        className={getHeaderClasses()}
        style={{ backgroundColor: settings.headerStyle === 'solid' ? settings.surfaceColor : undefined }}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Left side - Hamburger (if left positioned) */}
          {settings.showHamburger && settings.hamburgerPosition === 'left' && (
            <button
              onClick={toggleMenu}
              className="p-2 rounded-xl hover:bg-white/10 transition-all duration-300 group"
              aria-label="Toggle menu"
            >
              <div className="space-y-1">
                <div 
                  className={`w-6 h-0.5 transition-all duration-300 ${
                    isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                  }`}
                  style={{ backgroundColor: settings.textColor }}
                />
                <div 
                  className={`w-6 h-0.5 transition-all duration-300 ${
                    isMenuOpen ? 'opacity-0' : ''
                  }`}
                  style={{ backgroundColor: settings.textColor }}
                />
                <div 
                  className={`w-6 h-0.5 transition-all duration-300 ${
                    isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                  }`}
                  style={{ backgroundColor: settings.textColor }}
                />
              </div>
            </button>
          )}

          {/* Center - Logo */}
          {settings.showLogo && settings.logoPosition === 'center' && (
            <div className="flex-1 flex justify-center">
              {renderLogo()}
            </div>
          )}

          {/* Left - Logo (if left positioned) */}
          {settings.showLogo && settings.logoPosition === 'left' && renderLogo()}

          {/* Right side content */}
          <div className="flex items-center space-x-4">
            
            {/* Right - Logo (if right positioned) */}
            {settings.showLogo && settings.logoPosition === 'right' && renderLogo()}

            {/* Auth Buttons */}
            {settings.showAuthButtons && (
              <div className="flex items-center space-x-3">
                {session ? (
                  <div className="flex items-center space-x-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={session.user?.image || '/default-avatar.png'}
                      alt={session.user?.name || 'User'}
                      className="w-8 h-8 rounded-full border-2 border-white/20"
                    />
                    <button
                      onClick={() => signOut()}
                      className="px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                      style={{ 
                        backgroundColor: '#ef4444', 
                        color: 'white' 
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => signIn()}
                    className="px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                    style={{ 
                      backgroundColor: settings.primaryColor, 
                      color: 'white' 
                    }}
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}

            {/* Right side - Hamburger (if right positioned) */}
            {settings.showHamburger && settings.hamburgerPosition === 'right' && (
              <button
                onClick={toggleMenu}
                className="p-2 rounded-xl hover:bg-white/10 transition-all duration-300"
                aria-label="Toggle menu"
              >
                <div className="space-y-1">
                  <div 
                    className={`w-6 h-0.5 transition-all duration-300 ${
                      isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                    }`}
                    style={{ backgroundColor: settings.textColor }}
                  />
                  <div 
                    className={`w-6 h-0.5 transition-all duration-300 ${
                      isMenuOpen ? 'opacity-0' : ''
                    }`}
                    style={{ backgroundColor: settings.textColor }}
                  />
                  <div 
                    className={`w-6 h-0.5 transition-all duration-300 ${
                      isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                    }`}
                    style={{ backgroundColor: settings.textColor }}
                  />
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* Full Screen Menu Overlay */}
      <div className={`
        fixed inset-0 z-40 transition-all duration-500
        ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}>
        {/* Background */}
        <div 
          className="absolute inset-0 backdrop-blur-2xl"
          style={{ backgroundColor: `${settings.surfaceColor}e6` }}
          onClick={closeMenu}
        />
        
        {/* Menu Content */}
        <div className={`
          relative h-full flex items-center justify-center transition-all duration-500
          ${isMenuOpen ? 'translate-y-0' : '-translate-y-8'}
        `}>
          <div className="max-w-md w-full mx-4">
            
            {/* Menu Header */}
            <div className="text-center mb-8">
              {renderLogo()}
            </div>

            {/* Menu Items */}
            <div className="space-y-2">
              {visibleMenuItems.map(renderMenuItem)}
            </div>

            {/* Close hint */}
            <div className="text-center mt-8">
              <p 
                className="text-sm opacity-50"
                style={{ color: settings.textColor }}
              >
                Click anywhere to close
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
