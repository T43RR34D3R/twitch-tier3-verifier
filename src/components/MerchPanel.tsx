"use client";

import { useEffect, useState } from "react";

interface MerchItem {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
  price: string;
  isEnabled: boolean;
  orderIndex: number;
}

interface MerchSettings {
  isEnabled: boolean;
  title: string;
  subtitle?: string;
  maxItemsToShow: number;
  layout: 'grid' | 'carousel' | 'list';
  showPrices: boolean;
  items: MerchItem[];
}

interface MerchPanelProps {
  isAdmin?: boolean;
}

export default function MerchPanel({ isAdmin = false }: MerchPanelProps) {
  const [settings, setSettings] = useState<MerchSettings>({
    isEnabled: true,
    title: "Check Out My Merch!",
    subtitle: "Support the stream with some awesome gear!",
    maxItemsToShow: 6,
    layout: 'grid',
    showPrices: true,
    items: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMerchSettings();
  }, []);

  const loadMerchSettings = async () => {
    try {
      const response = await fetch('/api/merch-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error loading merch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 animate-pulse">
        <div className="h-6 bg-white/20 rounded mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-white/20 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!settings.isEnabled || settings.items.length === 0) {
    return null;
  }

  const visibleItems = settings.items
    .filter(item => item.isEnabled)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .slice(0, settings.maxItemsToShow);

  const renderGridLayout = () => (
    <div className={`grid gap-4 ${
      settings.maxItemsToShow <= 3 ? 'grid-cols-1 md:grid-cols-3' :
      settings.maxItemsToShow <= 4 ? 'grid-cols-2 md:grid-cols-4' :
      'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
    }`}>
      {visibleItems.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20 hover:border-purple-400 transition-all duration-300 hover:scale-105 hover:bg-white/20"
        >
          <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden mb-3">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTA1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTQ5NEE0IiBmb250LXNpemU9IjE0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPk1lcmNoPC90ZXh0Pgo8L3N2Zz4K';
              }}
            />
          </div>
          <h4 className="text-white font-semibold text-sm mb-1 line-clamp-2">{item.title}</h4>
          {settings.showPrices && item.price && (
            <p className="text-purple-300 font-bold text-lg">{item.price}</p>
          )}
        </a>
      ))}
    </div>
  );

  const renderCarouselLayout = () => (
    <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
      {visibleItems.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex-none w-48 bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20 hover:border-purple-400 transition-all duration-300 hover:scale-105 hover:bg-white/20"
        >
          <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden mb-3">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTA1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTQ5NEE0IiBmb250LXNpemU9IjE0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPk1lcmNoPC90ZXh0Pgo8L3N2Zz4K';
              }}
            />
          </div>
          <h4 className="text-white font-semibold text-sm mb-1 line-clamp-2">{item.title}</h4>
          {settings.showPrices && item.price && (
            <p className="text-purple-300 font-bold text-sm">{item.price}</p>
          )}
        </a>
      ))}
    </div>
  );

  const renderListLayout = () => (
    <div className="space-y-4">
      {visibleItems.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center space-x-4 bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20 hover:border-purple-400 transition-all duration-300 hover:bg-white/20"
        >
          <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTA1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTQ5NEE0IiBmb250LXNpemU9IjE0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPk1lcmNoPC90ZXh0Pgo8L3N2Zz4K';
              }}
            />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-semibold text-sm mb-1">{item.title}</h4>
            {settings.showPrices && item.price && (
              <p className="text-purple-300 font-bold text-sm">{item.price}</p>
            )}
          </div>
          <div className="text-white/60 group-hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </a>
      ))}
    </div>
  );

  return (
    <section className="mb-16">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400 transition-all duration-300">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {settings.title}
          </h2>
          {settings.subtitle && (
            <p className="text-lg text-gray-300">
              {settings.subtitle}
            </p>
          )}
        </div>

        {/* Merch Items */}
        {settings.layout === 'grid' && renderGridLayout()}
        {settings.layout === 'carousel' && renderCarouselLayout()}
        {settings.layout === 'list' && renderListLayout()}

        {/* Admin Edit Button */}
        {isAdmin && (
          <div className="mt-6 text-center">
            <a
              href="/admin#merch"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Merch</span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
