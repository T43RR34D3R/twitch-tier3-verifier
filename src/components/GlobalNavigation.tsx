"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

interface NavigationSettings {
  site_title: string;
  site_icon: string;
  background_type: 'gradient' | 'image' | 'solid';
  background_value: string;
  menu_items: MenuItem[];
  show_auth_buttons: boolean;
  header_style: 'glass' | 'solid' | 'transparent';
  accent_color: string;
}

interface MenuItem {
  id: string;
  label: string;
  url: string;
  icon: string;
  show_to: 'all' | 'authenticated' | 'unauthenticated';
  is_external: boolean;
  order: number;
}

const defaultSettings: NavigationSettings = {
  site_title: "BuckFoozle Toolkit",
  site_icon: "🎮",
  background_type: 'gradient',
  background_value: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)',
  menu_items: [
    { id: '1', label: 'Home', url: '/', icon: '🏠', show_to: 'all', is_external: false, order: 1 },
    { id: '2', label: 'T3 Verification', url: '/t3verify', icon: '👑', show_to: 'all', is_external: false, order: 2 },
    { id: '3', label: 'Subathon Timer', url: '/subathon-timer', icon: '⏰', show_to: 'all', is_external: false, order: 3 },
    { id: '4', label: 'Analytics', url: '/analytics', icon: '📊', show_to: 'all', is_external: false, order: 4 },
    { id: '5', label: 'Admin Panel', url: '/admin', icon: '⚙️', show_to: 'authenticated', is_external: false, order: 5 },
    { id: '6', label: 'Twitch', url: 'https://twitch.tv/buckfoozle', icon: '💜', show_to: 'all', is_external: true, order: 6 }
  ],
  show_auth_buttons: true,
  header_style: 'glass',
  accent_color: '#8b5cf6'
};

export default function GlobalNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settings, setSettings] = useState<NavigationSettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    loadNavigationSettings();
  }, []);

  const loadNavigationSettings = async () => {
    try {
      const response = await fetch('/api/navigation-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data });
      }
    } catch (error) {
      console.error('Error loading navigation settings:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const getBackgroundStyle = () => {
    switch (settings.background_type) {
      case 'gradient':
        return { background: settings.background_value };
      case 'image':
        return { 
          backgroundImage: `url(${settings.background_value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      case 'solid':
        return { backgroundColor: settings.background_value };
      default:
        return { background: defaultSettings.background_value };
    }
  };

  const getHeaderStyle = () => {
    const baseStyle = "fixed top-0 left-0 right-0 z-50 transition-all duration-300";
    
    switch (settings.header_style) {
      case 'glass':
        return `${baseStyle} bg-black/20 backdrop-blur-xl border-b border-gray-700/50 shadow-2xl`;
      case 'solid':
        return `${baseStyle} bg-gray-900/95 border-b border-gray-700 shadow-xl`;
      case 'transparent':
        return `${baseStyle} bg-transparent`;
      default:
        return `${baseStyle} bg-black/20 backdrop-blur-xl border-b border-gray-700/50 shadow-2xl`;
    }
  };

  const filterMenuItems = (items: MenuItem[]) => {
    return items
      .filter(item => {
        if (item.show_to === 'all') return true;
        if (item.show_to === 'authenticated') return !!session;
        if (item.show_to === 'unauthenticated') return !session;
        return false;
      })
      .sort((a, b) => a.order - b.order);
  };

  if (!mounted) return null;

  const filteredMenuItems = filterMenuItems(settings.menu_items);

  return (
    <>
      {/* Background */}
      <div 
        className="fixed inset-0 -z-10" 
        style={getBackgroundStyle()}
      />

      {/* Header */}
      <header className={getHeaderStyle()}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="text-2xl">{settings.site_icon}</div>
              <span className="text-xl font-bold text-white">{settings.site_title}</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {filteredMenuItems.slice(0, 5).map((item) => (
                item.is_external ? (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-gray-100 hover:bg-white/10 hover:text-white transition-all duration-300 font-medium ${
                      pathname === item.url ? 'bg-purple-500/20 text-purple-300 shadow-lg' : ''
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <Link
                    key={item.id}
                    href={item.url}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-gray-100 hover:bg-white/10 hover:text-white transition-all duration-300 font-medium ${
                      pathname === item.url ? 'bg-purple-500/20 text-purple-300 shadow-lg' : ''
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              ))}
              
              {/* Auth Buttons */}
              {settings.show_auth_buttons && (
                <div className="flex items-center space-x-3 ml-6">
                  {session ? (
                    <div className="flex items-center space-x-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={session.user?.image || '/default-avatar.png'}
                        alt={session.user?.name || 'User'}
                        className="w-8 h-8 rounded-full"
                      />
                      <button
                        onClick={() => signOut()}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/t3verify"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
              )}
            </nav>

            {/* Mobile Hamburger Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden relative w-10 h-10 focus:outline-none"
              aria-label="Toggle menu"
            >
              <div className="absolute inset-0 flex flex-col justify-center items-center">
                <div className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                }`} />
                <div className={`w-6 h-0.5 bg-white mt-1 transition-all duration-300 ${
                  isMenuOpen ? 'opacity-0' : ''
                }`} />
                <div className={`w-6 h-0.5 bg-white mt-1 transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                }`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ${
          isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden bg-black/20 backdrop-blur-lg border-t border-white/10`}>
          <div className="px-4 py-4 space-y-2">
            {filteredMenuItems.map((item) => (
              item.is_external ? (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-white hover:bg-white/20 transition-all duration-200 ${
                    pathname === item.url ? 'bg-white/20' : ''
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              ) : (
                <Link
                  key={item.id}
                  href={item.url}
                  onClick={closeMenu}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-white hover:bg-white/20 transition-all duration-200 ${
                    pathname === item.url ? 'bg-white/20' : ''
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            ))}

            {/* Mobile Auth */}
            {settings.show_auth_buttons && (
              <div className="pt-4 border-t border-white/10">
                {session ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 px-4 py-2 text-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={session.user?.image || '/default-avatar.png'}
                        alt={session.user?.name || 'User'}
                        className="w-8 h-8 rounded-full"
                      />
                      <span>Welcome, {session.user?.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        signOut();
                        closeMenu();
                      }}
                      className="w-full text-left px-4 py-3 text-white hover:bg-red-600/20 rounded-lg transition-colors"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth/signin"
                    onClick={closeMenu}
                    className="flex items-center space-x-3 px-4 py-3 text-white hover:bg-purple-600/20 rounded-lg transition-colors"
                  >
                    <span>🔐</span>
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMenu}
        />
      )}
    </>
  );
}
