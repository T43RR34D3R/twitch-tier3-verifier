"use client";

import { useEffect, useState } from "react";

interface BackgroundSettings {
  background_image?: string;
  background_blur?: boolean;
  background_vignette?: boolean;
  background_overlay_opacity?: number;
}

interface CustomBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export default function CustomBackground({ children, className = "" }: CustomBackgroundProps) {
  const [backgroundSettings, setBackgroundSettings] = useState<BackgroundSettings>({
    background_image: "/buckfoozle-bg.png",
    background_blur: true,
    background_vignette: true,
    background_overlay_opacity: 0.4
  });

  useEffect(() => {
    loadBackgroundSettings();
  }, []);

  const loadBackgroundSettings = async () => {
    try {
      const response = await fetch('/api/customization-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setBackgroundSettings({
            background_image: data.settings.backgroundImage || "/buckfoozle-bg.png",
            background_blur: data.settings.backgroundBlur !== false,
            background_vignette: data.settings.backgroundVignette !== false,
            background_overlay_opacity: data.settings.backgroundOverlayOpacity || 0.4
          });
        }
      }
    } catch (error) {
      console.error('Error loading background settings:', error);
    }
  };

  const getBackgroundStyle = () => ({
    backgroundImage: `url(${backgroundSettings.background_image})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  });

  const getOverlayOpacity = () => {
    return backgroundSettings.background_overlay_opacity || 0.4;
  };

  return (
    <div 
      className={`min-h-screen bg-cover bg-center bg-no-repeat relative ${className}`} 
      style={getBackgroundStyle()}
    >
      {/* Backdrop blur and overlay */}
      {backgroundSettings.background_blur && (
        <div 
          className="absolute inset-0 backdrop-blur-sm"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${getOverlayOpacity()})`
          }}
        ></div>
      )}
      
      {/* Vignette effect */}
      {backgroundSettings.background_vignette && (
        <div 
          className="absolute inset-0" 
          style={{
            background: 'radial-gradient(circle at center, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 100%)'
          }}
        ></div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
