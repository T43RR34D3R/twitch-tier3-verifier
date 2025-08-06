"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import LogoUpload from "./LogoUpload";
import BackgroundUpload from "./BackgroundUpload";

interface CustomizationSettings {
  siteTitle: string;
  siteLogo: string;
  logoType: 'emoji' | 'image' | 'text';
  logoImageUrl?: string;
  logoCircular?: boolean;
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

interface HomeSection {
  id: string;
  type: 'hero' | 'about' | 'tools' | 'twitch-embed' | 'social' | 'custom';
  title: string;
  isEnabled: boolean;
  orderIndex: number;
  content: {
    // Hero section
    heroTitle?: string;
    heroSubtitle?: string;
    heroImage?: string;
    heroButtons?: Array<{ label: string; url: string; style: 'primary' | 'secondary' }>;
    
    // About section
    aboutTitle?: string;
    aboutText?: string;
    aboutImage?: string;
    aboutImagePosition?: 'left' | 'right';
    
    // Tools section
    toolsTitle?: string;
    showToolCards?: boolean;
    
    // Twitch embed
    twitchChannel?: string;
    embedType?: 'player' | 'chat' | 'both';
    
    // Social section
    socialTitle?: string;
    showSocialCards?: boolean;
    socialLinks?: Array<{ platform: string; url: string; icon: string; color: string }>;
    
    // Custom section
    customHtml?: string;
    customCss?: string;
  };
}

const defaultSettings: CustomizationSettings = {
  siteTitle: "BuckFoozle",
  siteLogo: "👑",
  logoType: "image",
  logoImageUrl: "/buckwhite-logo.png",
  tagline: "Variety Streamer & Content Creator",
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6", 
  accentColor: "#f59e0b",
  textColor: "#ffffff",
  surfaceColor: "#1e293b",
  backgroundType: "image",
  backgroundValue: "/buckfoozle-bg.png",
  headerStyle: "glass",
  showLogo: true,
  logoPosition: "center",
  showHamburger: true,
  hamburgerPosition: "left",
  showAuthButtons: true,
  taglineAlignment: "center",
  footerText: "Made with 💜 for the Best Friends Club",
  footerLinkText: "twitch.tv/buckfoozle",
  footerLinkUrl: "https://twitch.tv/buckfoozle",
};

const defaultMenuItems: MenuItem[] = [
  { id: "1", label: "Home", url: "/", iconType: "emoji", iconValue: "🏠", visibility: "all", isExternal: false, openInNewTab: false, orderIndex: 1, isEnabled: true },
  { id: "2", label: "Watch Live", url: "https://twitch.tv/buckfoozle", iconType: "emoji", iconValue: "📺", visibility: "all", isExternal: true, openInNewTab: true, orderIndex: 2, isEnabled: true },
  { id: "3", label: "Discord", url: "https://discord.gg/buckfoozle", iconType: "emoji", iconValue: "💬", visibility: "all", isExternal: true, openInNewTab: true, orderIndex: 3, isEnabled: true },
  { id: "4", label: "Twitter", url: "https://twitter.com/buckfoozle", iconType: "emoji", iconValue: "🐦", visibility: "all", isExternal: true, openInNewTab: true, orderIndex: 4, isEnabled: true },
  { id: "5", label: "YouTube", url: "https://youtube.com/@buckfoozle", iconType: "emoji", iconValue: "📹", visibility: "all", isExternal: true, openInNewTab: true, orderIndex: 5, isEnabled: true },
  { id: "6", label: "Admin Panel", url: "/admin", iconType: "emoji", iconValue: "⚙️", visibility: "admin", isExternal: false, openInNewTab: false, orderIndex: 6, isEnabled: true },
];

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

export default function SiteCustomizationPanel() {
  const [activeTab, setActiveTab] = useState<'site' | 'navigation' | 'homepage'>('site');
  const [settings, setSettings] = useState<CustomizationSettings>(defaultSettings);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(defaultMenuItems);
  const [homeSections, setHomeSections] = useState<HomeSection[]>(defaultHomeSections);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null);
  const [selectedHomeSection, setSelectedHomeSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/customization-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) setSettings({ ...defaultSettings, ...data.settings });
        if (data.menuItems) setMenuItems(data.menuItems);
        if (data.homeSections) setHomeSections(data.homeSections);
      }
    } catch (error) {
      console.log('Using default settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/customization-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, menuItems, homeSections })
      });
      
      if (response.ok) {
        setSaveMessage("✅ Settings saved successfully!");
        setTimeout(() => setSaveMessage(""), 3000);
        
        // Emit event to refresh navigation
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('customizationUpdated'));
        }
      } else {
        const errorData = await response.json();
        setSaveMessage(`❌ Failed to save: ${errorData.error || 'Unknown error'}`);
        console.error('Save failed:', errorData);
      }
    } catch (error) {
      setSaveMessage("❌ Error saving settings: " + error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof CustomizationSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const addMenuItem = () => {
    const newItem: MenuItem = {
      id: Date.now().toString(),
      label: "New Menu Item",
      url: "/",
      iconType: "emoji",
      iconValue: "📄",
      visibility: "all",
      isExternal: false,
      openInNewTab: false,
      orderIndex: menuItems.length + 1,
      isEnabled: true
    };
    setMenuItems(prev => [...prev, newItem]);
    setSelectedMenuItem(newItem.id);
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== id));
    if (selectedMenuItem === id) setSelectedMenuItem(null);
  };

  const onMenuDragEnd = (result: { destination: { index: number } | null; source: { index: number } }) => {
    if (!result.destination) return;

    const items = Array.from(menuItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      orderIndex: index + 1
    }));

    setMenuItems(updatedItems);
  };

  const onHomeSectionDragEnd = (result: { destination: { index: number } | null; source: { index: number } }) => {
    if (!result.destination) return;

    const sections = Array.from(homeSections);
    const [reorderedSection] = sections.splice(result.source.index, 1);
    sections.splice(result.destination.index, 0, reorderedSection);

    const updatedSections = sections.map((section, index) => ({
      ...section,
      orderIndex: index + 1
    }));

    setHomeSections(updatedSections);
  };

  const updateHomeSection = (id: string, updates: Partial<HomeSection>) => {
    setHomeSections(prev => prev.map(section =>
      section.id === id ? { ...section, ...updates } : section
    ));
  };

  const renderSiteSettings = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Site Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Site Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">Site Title</label>
            <input
              type="text"
              value={settings.siteTitle}
              onChange={(e) => updateSetting('siteTitle', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Tagline</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => updateSetting('tagline', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Tagline Alignment</label>
            <select
              value={settings.taglineAlignment}
              onChange={(e) => updateSetting('taglineAlignment', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Logo Type</label>
            <select
              value={settings.logoType}
              onChange={(e) => updateSetting('logoType', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="emoji">Emoji</option>
              <option value="text">Text</option>
              <option value="image">Image</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {settings.logoType === 'image' ? 'Logo Image' : 'Logo Content'}
            </label>
            {settings.logoType === 'image' ? (
              <div className="space-y-4">
                <LogoUpload
                  currentLogoUrl={settings.logoImageUrl}
                  logoType={settings.logoType}
                  onUploadSuccess={(url) => {
                    updateSetting('logoImageUrl', url);
                    setSaveMessage("✅ Logo uploaded successfully! Don't forget to save your changes.");
                    setTimeout(() => setSaveMessage(""), 5000);
                  }}
                  onUploadError={(error) => {
                    setSaveMessage(`❌ Upload failed: ${error}`);
                    setTimeout(() => setSaveMessage(""), 5000);
                  }}
                />
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Or paste URL directly:</label>
                  <input
                    type="text"
                    value={settings.logoImageUrl || ''}
                    onChange={(e) => updateSetting('logoImageUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={settings.siteLogo}
                onChange={(e) => updateSetting('siteLogo', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {settings.logoType === 'image' && (
            <div>
              <label className="flex items-center space-x-2 text-white">
                <input
                  type="checkbox"
                  checked={settings.logoCircular || false}
                  onChange={(e) => updateSetting('logoCircular', e.target.checked)}
                  className="rounded border-white/20 text-blue-500 focus:ring-blue-500"
                />
                <span>Make logo circular</span>
              </label>
            </div>
          )}
        </div>

        {/* Colors */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Colors</h3>
          
          {[
            { key: 'primaryColor', label: 'Primary Color' },
            { key: 'secondaryColor', label: 'Secondary Color' },
            { key: 'accentColor', label: 'Accent Color' },
            { key: 'textColor', label: 'Text Color' },
            { key: 'surfaceColor', label: 'Surface Color' }
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-white mb-2">{label}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings[key as keyof CustomizationSettings] as string}
                  onChange={(e) => updateSetting(key as keyof CustomizationSettings, e.target.value)}
                  className="w-12 h-10 rounded-lg border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings[key as keyof CustomizationSettings] as string}
                  onChange={(e) => updateSetting(key as keyof CustomizationSettings, e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Background</h3>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">Background Type</label>
          <select
            value={settings.backgroundType}
            onChange={(e) => updateSetting('backgroundType', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="gradient">Gradient</option>
            <option value="solid">Solid Color</option>
            <option value="image">Image</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            {settings.backgroundType === 'gradient' ? 'CSS Gradient' : 
             settings.backgroundType === 'image' ? 'Background Image' : 'Color'}
          </label>
          {settings.backgroundType === 'image' ? (
            <div className="space-y-4">
              <BackgroundUpload
                currentBackgroundUrl={settings.backgroundValue.startsWith('http') || settings.backgroundValue.startsWith('/') ? settings.backgroundValue : undefined}
                backgroundType={settings.backgroundType}
                onUploadSuccess={(url) => {
                  updateSetting('backgroundValue', url);
                  setSaveMessage("✅ Background uploaded successfully! Don't forget to save your changes.");
                  setTimeout(() => setSaveMessage(""), 5000);
                }}
                onUploadError={(error) => {
                  setSaveMessage(`❌ Upload failed: ${error}`);
                  setTimeout(() => setSaveMessage(""), 5000);
                }}
              />
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Or paste URL directly:</label>
                <input
                  type="text"
                  value={settings.backgroundValue}
                  onChange={(e) => updateSetting('backgroundValue', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <input
              type="text"
              value={settings.backgroundValue}
              onChange={(e) => updateSetting('backgroundValue', e.target.value)}
              placeholder={
                settings.backgroundType === 'gradient' ? 'linear-gradient(135deg, #000000, #333333)' : '#000000'
              }
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      </div>

      {/* Header Settings */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Header Style</h3>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">Style</label>
            <select
              value={settings.headerStyle}
              onChange={(e) => updateSetting('headerStyle', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="glass">Glass Effect</option>
              <option value="solid">Solid</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Logo Position</label>
            <select
              value={settings.logoPosition}
              onChange={(e) => updateSetting('logoPosition', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Hamburger Position</label>
            <select
              value={settings.hamburgerPosition}
              onChange={(e) => updateSetting('hamburgerPosition', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Visibility</h3>
          
          {[
            { key: 'showLogo', label: 'Show Logo' },
            { key: 'showHamburger', label: 'Show Hamburger Menu' },
            { key: 'showAuthButtons', label: 'Show Auth Buttons' }
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={settings[key as keyof CustomizationSettings] as boolean}
                onChange={(e) => updateSetting(key as keyof CustomizationSettings, e.target.checked)}
                className="rounded border-white/20 text-blue-500 focus:ring-blue-500"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Footer Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Footer Settings</h3>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">Footer Text</label>
          <input
            type="text"
            value={settings.footerText || ''}
            onChange={(e) => updateSetting('footerText', e.target.value)}
            placeholder="Made with 💜 for the community"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Footer Link Text</label>
            <input
              type="text"
              value={settings.footerLinkText || ''}
              onChange={(e) => updateSetting('footerLinkText', e.target.value)}
              placeholder="Visit my Twitch"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Footer Link URL</label>
            <input
              type="url"
              value={settings.footerLinkUrl || ''}
              onChange={(e) => updateSetting('footerLinkUrl', e.target.value)}
              placeholder="https://twitch.tv/buckfoozle"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNavigationSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Menu Items</h3>
        <button
          onClick={addMenuItem}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
        >
          Add Menu Item
        </button>
      </div>

      <DragDropContext onDragEnd={onMenuDragEnd}>
        <Droppable droppableId="menu-items">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {menuItems
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer transition-all ${
                          selectedMenuItem === item.id ? 'bg-white/10 border-blue-500' : 'hover:bg-white/10'
                        }`}
                        onClick={() => setSelectedMenuItem(selectedMenuItem === item.id ? null : item.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div {...provided.dragHandleProps} className="text-white/50 cursor-grab hover:text-white">
                              ⋮⋮
                            </div>
                            <span className="text-xl">{item.iconValue}</span>
                            <span className="text-white font-medium">{item.label}</span>
                            {!item.isEnabled && <span className="text-red-400 text-sm">(Disabled)</span>}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-white/50 px-2 py-1 bg-white/10 rounded-full">
                              {item.visibility}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMenuItem(item.id);
                              }}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {selectedMenuItem === item.id && (
                          <div className="mt-4 pt-4 border-t border-white/10 grid md:grid-cols-2 gap-4" onClick={(e) => e.stopPropagation()}>
                            <div>
                              <label className="block text-sm font-medium text-white mb-1">Label</label>
                              <input
                                type="text"
                                value={item.label}
                                onChange={(e) => updateMenuItem(item.id, { label: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-white mb-1">URL</label>
                              <input
                                type="text"
                                value={item.url}
                                onChange={(e) => updateMenuItem(item.id, { url: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-white mb-1">Icon</label>
                              <input
                                type="text"
                                value={item.iconValue}
                                onChange={(e) => updateMenuItem(item.id, { iconValue: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-white mb-1">Visibility</label>
                              <select
                                value={item.visibility}
                                onChange={(e) => updateMenuItem(item.id, { visibility: e.target.value as MenuItem['visibility'] })}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                              >
                                <option value="all">Everyone</option>
                                <option value="authenticated">Logged In Users</option>
                                <option value="unauthenticated">Guests Only</option>
                                <option value="admin">Admins Only</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-white mb-1">Description (optional)</label>
                              <input
                                type="text"
                                value={item.description || ''}
                                onChange={(e) => updateMenuItem(item.id, { description: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                              />
                            </div>

                            <div className="flex items-center space-x-4 text-sm">
                              <label className="flex items-center space-x-2 text-white" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={item.isEnabled}
                                  onChange={(e) => updateMenuItem(item.id, { isEnabled: e.target.checked })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded border-white/20 text-blue-500"
                                />
                                <span>Enabled</span>
                              </label>

                              <label className="flex items-center space-x-2 text-white" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={item.isExternal}
                                  onChange={(e) => updateMenuItem(item.id, { isExternal: e.target.checked })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded border-white/20 text-blue-500"
                                />
                                <span>External Link</span>
                              </label>

                              <label className="flex items-center space-x-2 text-white" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={item.openInNewTab}
                                  onChange={(e) => updateMenuItem(item.id, { openInNewTab: e.target.checked })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded border-white/20 text-blue-500"
                                />
                                <span>New Tab</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );

  const renderHomepageSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Homepage Sections</h3>
        <span className="text-sm text-white/70">Drag to reorder sections</span>
      </div>

      <DragDropContext onDragEnd={onHomeSectionDragEnd}>
        <Droppable droppableId="home-sections">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {homeSections
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((section, index) => (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white/5 border border-white/10 rounded-xl p-4 transition-all ${
                          selectedHomeSection === section.id ? 'bg-white/10 border-blue-500' : 'hover:bg-white/10'
                        }`}
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setSelectedHomeSection(selectedHomeSection === section.id ? null : section.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div {...provided.dragHandleProps} className="text-white/50 cursor-grab hover:text-white">
                              ⋮⋮
                            </div>
                            <span className="text-white font-medium">{section.title}</span>
                            <span className="text-xs text-white/50 px-2 py-1 bg-white/10 rounded-full">
                              {section.type}
                            </span>
                            {!section.isEnabled && <span className="text-red-400 text-sm">(Disabled)</span>}
                          </div>
                          <label className="flex items-center space-x-2 text-white" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={section.isEnabled}
                              onChange={(e) => updateHomeSection(section.id, { isEnabled: e.target.checked })}
                              className="rounded border-white/20 text-blue-500"
                            />
                            <span className="text-sm">Enabled</span>
                          </label>
                        </div>

                        {selectedHomeSection === section.id && (
                          <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                            {section.type === 'hero' && (
                              <div className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-white mb-1">Hero Title</label>
                                    <input
                                      type="text"
                                      value={section.content.heroTitle || ''}
                                      onChange={(e) => updateHomeSection(section.id, {
                                        content: { ...section.content, heroTitle: e.target.value }
                                      })}
                                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-white mb-1">Hero Image URL</label>
                                    <input
                                      type="text"
                                      value={section.content.heroImage || ''}
                                      onChange={(e) => updateHomeSection(section.id, {
                                        content: { ...section.content, heroImage: e.target.value }
                                      })}
                                      placeholder="https://example.com/hero-image.jpg"
                                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-white mb-1">Hero Subtitle</label>
                                  <textarea
                                    rows={2}
                                    value={section.content.heroSubtitle || ''}
                                    onChange={(e) => updateHomeSection(section.id, {
                                      content: { ...section.content, heroSubtitle: e.target.value }
                                    })}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                                  />
                                </div>

                                <div>
                                  <h4 className="text-sm font-medium text-white mb-2">Hero Buttons</h4>
                                  {section.content.heroButtons?.map((button, index) => (
                                    <div key={index} className="grid md:grid-cols-4 gap-2 mb-2 p-3 bg-white/5 rounded-lg">
                                      <div>
                                        <label className="block text-xs text-white/70 mb-1">Label</label>
                                        <input
                                          type="text"
                                          value={button.label}
                                          onChange={(e) => {
                                            const updatedButtons = [...(section.content.heroButtons || [])];
                                            updatedButtons[index] = { ...button, label: e.target.value };
                                            updateHomeSection(section.id, {
                                              content: { ...section.content, heroButtons: updatedButtons }
                                            });
                                          }}
                                          className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                        />
                                      </div>
                                      
                                      <div>
                                        <label className="block text-xs text-white/70 mb-1">URL</label>
                                        <input
                                          type="text"
                                          value={button.url}
                                          onChange={(e) => {
                                            const updatedButtons = [...(section.content.heroButtons || [])];
                                            updatedButtons[index] = { ...button, url: e.target.value };
                                            updateHomeSection(section.id, {
                                              content: { ...section.content, heroButtons: updatedButtons }
                                            });
                                          }}
                                          className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                        />
                                      </div>
                                      
                                      <div>
                                        <label className="block text-xs text-white/70 mb-1">Style</label>
                                        <select
                                          value={button.style}
                                          onChange={(e) => {
                                            const updatedButtons = [...(section.content.heroButtons || [])];
                                            updatedButtons[index] = { ...button, style: e.target.value as 'primary' | 'secondary' };
                                            updateHomeSection(section.id, {
                                              content: { ...section.content, heroButtons: updatedButtons }
                                            });
                                          }}
                                          className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                        >
                                          <option value="primary">Primary</option>
                                          <option value="secondary">Secondary</option>
                                        </select>
                                      </div>
                                      
                                      <div className="flex items-end">
                                        <button
                                          onClick={() => {
                                            const updatedButtons = section.content.heroButtons?.filter((_, i) => i !== index) || [];
                                            updateHomeSection(section.id, {
                                              content: { ...section.content, heroButtons: updatedButtons }
                                            });
                                          }}
                                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  <button
                                    onClick={() => {
                                      const newButton = { label: 'New Button', url: '#', style: 'primary' as const };
                                      const updatedButtons = [...(section.content.heroButtons || []), newButton];
                                      updateHomeSection(section.id, {
                                        content: { ...section.content, heroButtons: updatedButtons }
                                      });
                                    }}
                                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                                  >
                                    Add Button
                                  </button>
                                </div>
                              </div>
                            )}

                            {section.type === 'about' && (
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-white mb-1">Title</label>
                                  <input
                                    type="text"
                                    value={section.content.aboutTitle || ''}
                                    onChange={(e) => updateHomeSection(section.id, {
                                      content: { ...section.content, aboutTitle: e.target.value }
                                    })}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-white mb-1">Profile Image URL</label>
                                  <input
                                    type="text"
                                    value={section.content.aboutImage || ''}
                                    onChange={(e) => updateHomeSection(section.id, {
                                      content: { ...section.content, aboutImage: e.target.value }
                                    })}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-white mb-1">About Text</label>
                                  <textarea
                                    rows={3}
                                    value={section.content.aboutText || ''}
                                    onChange={(e) => updateHomeSection(section.id, {
                                      content: { ...section.content, aboutText: e.target.value }
                                    })}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-white mb-1">Image Position</label>
                                  <select
                                    value={section.content.aboutImagePosition || 'left'}
                                    onChange={(e) => updateHomeSection(section.id, {
                                      content: { ...section.content, aboutImagePosition: e.target.value as 'left' | 'right' }
                                    })}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                                  >
                                    <option value="left">Left</option>
                                    <option value="right">Right</option>
                                  </select>
                                </div>
                              </div>
                            )}

                            {section.type === 'twitch-embed' && (
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-white mb-1">Twitch Channel</label>
                                  <input
                                    type="text"
                                    value={section.content.twitchChannel || ''}
                                    onChange={(e) => updateHomeSection(section.id, {
                                      content: { ...section.content, twitchChannel: e.target.value }
                                    })}
                                    placeholder="buckfoozle"
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-white mb-1">Embed Type</label>
                                  <select
                                    value={section.content.embedType || 'both'}
                                    onChange={(e) => updateHomeSection(section.id, {
                                      content: { ...section.content, embedType: e.target.value as 'player' | 'chat' | 'both' }
                                    })}
                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                                  >
                                    <option value="player">Player Only</option>
                                    <option value="chat">Chat Only</option>
                                    <option value="both">Player + Chat</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Site Customization</h2>
        <div className="flex items-center space-x-3">
          {saveMessage && (
            <span className={`text-sm ${saveMessage.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
              {saveMessage}
            </span>
          )}
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-white/5 p-1 rounded-xl">
        {[
          { id: 'site', label: 'Site Settings' },
          { id: 'navigation', label: 'Navigation' },
          { id: 'homepage', label: 'Homepage' }
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as 'site' | 'navigation' | 'homepage')}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              activeTab === id 
                ? 'bg-blue-600 text-white' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'site' && renderSiteSettings()}
        {activeTab === 'navigation' && renderNavigationSettings()}
        {activeTab === 'homepage' && renderHomepageSettings()}
      </div>
    </div>
  );
}
