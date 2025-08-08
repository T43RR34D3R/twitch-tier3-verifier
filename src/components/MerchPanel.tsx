"use client";

import { useEffect, useState } from "react";

interface FourthwallProduct {
  id: string;
  name: string;
  slug: string;
  price: {
    amount: number;
    currency: string;
  };
  images: {
    url: string;
    alt?: string;
  }[];
  description?: string;
  available: boolean;
}

interface MerchSettings {
  isEnabled: boolean;
  title: string;
  subtitle?: string;
  storeName: string; // Fourthwall store name (e.g., 'buckfoozle')
  storefrontToken?: string; // Fourthwall Storefront API token
  maxItemsToShow: number;
  layout: 'grid' | 'carousel' | 'list';
  showPrices: boolean;
  featuredProductIds: string[]; // Which products to show (empty = show all)
  autoSync: boolean;
}

interface MerchPanelProps {
  isAdmin?: boolean;
}

const defaultSettings: MerchSettings = {
  isEnabled: false,
  title: "Check Out My Merch!",
  subtitle: "Support the stream with some awesome gear!",
  storeName: '',
  maxItemsToShow: 6,
  layout: 'grid',
  showPrices: true,
  featuredProductIds: [],
  autoSync: true
};

export default function MerchPanel({ isAdmin = false }: MerchPanelProps) {
  const [settings, setSettings] = useState<MerchSettings>(defaultSettings);
  const [products, setProducts] = useState<FourthwallProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    loadMerchSettings();
  }, []);

  useEffect(() => {
    if (settings.storeName && settings.autoSync) {
      loadProducts();
    }
  }, [settings.storeName, settings.autoSync]);

  const loadMerchSettings = async () => {
    try {
      const response = await fetch('/api/merch-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({ ...defaultSettings, ...data.settings });
        }
      }
    } catch (error) {
      console.error('Error loading merch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    if (!settings.storeName) return;
    
    setProductsLoading(true);
    try {
      const response = await fetch(`/api/fourthwall/products?storeName=${settings.storeName}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="mb-16">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 animate-pulse">
          <div className="h-8 bg-white/20 rounded mb-4 mx-auto w-64"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-white/20 rounded-lg"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!settings.isEnabled || !settings.storeName) {
    return null;
  }

  // Filter products based on featured list (if specified) or show all
  const visibleProducts = settings.featuredProductIds.length > 0
    ? products.filter(product => settings.featuredProductIds.includes(product.id))
    : products.filter(product => product.available);

  const displayProducts = visibleProducts.slice(0, settings.maxItemsToShow);

  const formatPrice = (price: { amount: number; currency: string }) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency,
    }).format(price.amount / 100); // Fourthwall prices are in cents
  };

  const getProductUrl = (storeName: string, slug: string) => {
    return `https://fourthwall.com/shop/${storeName}/product/${slug}`;
  };

  const renderGridLayout = () => (
    <div className={`grid gap-4 ${
      settings.maxItemsToShow <= 3 ? 'grid-cols-1 md:grid-cols-3' :
      settings.maxItemsToShow <= 4 ? 'grid-cols-2 md:grid-cols-4' :
      'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
    }`}>
      {displayProducts.map((product) => (
        <a
          key={product.id}
          href={getProductUrl(settings.storeName, product.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20 hover:border-purple-400 transition-all duration-300 hover:scale-105 hover:bg-white/20"
        >
          <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden mb-3">
            <img
              src={product.images[0]?.url || ''}
              alt={product.images[0]?.alt || product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTA1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTQ5NEE0IiBmb250LXNpemU9IjE0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPk1lcmNoPC90ZXh0Pgo8L3N2Zz4K';
              }}
            />
          </div>
          <h4 className="text-white font-semibold text-sm mb-1 line-clamp-2">{product.name}</h4>
          {settings.showPrices && (
            <p className="text-purple-300 font-bold text-lg">{formatPrice(product.price)}</p>
          )}
        </a>
      ))}
    </div>
  );

  const renderCarouselLayout = () => (
    <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
      {displayProducts.map((product) => (
        <a
          key={product.id}
          href={getProductUrl(settings.storeName, product.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex-none w-48 bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20 hover:border-purple-400 transition-all duration-300 hover:scale-105 hover:bg-white/20"
        >
          <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden mb-3">
            <img
              src={product.images[0]?.url || ''}
              alt={product.images[0]?.alt || product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTA1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTQ5NEE0IiBmb250LXNpemU9IjE0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPk1lcmNoPC90ZXh0Pgo8L3N2Zz4K';
              }}
            />
          </div>
          <h4 className="text-white font-semibold text-sm mb-1 line-clamp-2">{product.name}</h4>
          {settings.showPrices && (
            <p className="text-purple-300 font-bold text-sm">{formatPrice(product.price)}</p>
          )}
        </a>
      ))}
    </div>
  );

  const renderListLayout = () => (
    <div className="space-y-4">
      {displayProducts.map((product) => (
        <a
          key={product.id}
          href={getProductUrl(settings.storeName, product.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center space-x-4 bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20 hover:border-purple-400 transition-all duration-300 hover:bg-white/20"
        >
          <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={product.images[0]?.url || ''}
              alt={product.images[0]?.alt || product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTA1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTQ5NEE0IiBmb250LXNpemU9IjE0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPk1lcmNoPC90ZXh0Pgo8L3N2Zz4K';
              }}
            />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-semibold text-sm mb-1">{product.name}</h4>
            {settings.showPrices && (
              <p className="text-purple-300 font-bold text-sm">{formatPrice(product.price)}</p>
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

  const renderProductLoadingState = () => {
    const skeletonCount = Math.min(settings.maxItemsToShow, 6);
    
    if (settings.layout === 'grid') {
      return (
        <div className={`grid gap-4 ${
          settings.maxItemsToShow <= 3 ? 'grid-cols-1 md:grid-cols-3' :
          settings.maxItemsToShow <= 4 ? 'grid-cols-2 md:grid-cols-4' :
          'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }`}>
          {[...Array(skeletonCount)].map((_, i) => (
            <div key={i} className="bg-white/10 rounded-lg p-4 animate-pulse">
              <div className="aspect-square bg-white/20 rounded-lg mb-3"></div>
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-4 bg-white/20 rounded w-16"></div>
            </div>
          ))}
        </div>
      );
    }
    
    if (settings.layout === 'carousel') {
      return (
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {[...Array(skeletonCount)].map((_, i) => (
            <div key={i} className="flex-none w-48 bg-white/10 rounded-lg p-4 animate-pulse">
              <div className="aspect-square bg-white/20 rounded-lg mb-3"></div>
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-4 bg-white/20 rounded w-16"></div>
            </div>
          ))}
        </div>
      );
    }
    
    // List layout
    return (
      <div className="space-y-4">
        {[...Array(skeletonCount)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 bg-white/10 rounded-lg p-4 animate-pulse">
            <div className="w-16 h-16 bg-white/20 rounded-lg flex-shrink-0"></div>
            <div className="flex-1">
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-4 bg-white/20 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderEmptyState = () => (
    <div className="text-center py-8">
      <div className="mb-4">
        <svg className="w-16 h-16 text-white/40 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No Products Available</h3>
      <p className="text-gray-400 mb-4">
        {products.length === 0 
          ? "No products found in the store. Check back later!" 
          : "No featured products are currently available."}
      </p>
      {isAdmin && (
        <a
          href="/admin#merch"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Configure Products</span>
        </a>
      )}
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

        {/* Content */}
        {productsLoading ? (
          renderProductLoadingState()
        ) : displayProducts.length > 0 ? (
          <>
            {settings.layout === 'grid' && renderGridLayout()}
            {settings.layout === 'carousel' && renderCarouselLayout()}
            {settings.layout === 'list' && renderListLayout()}
          </>
        ) : (
          renderEmptyState()
        )}

        {/* Admin Edit Button - Only show when not in empty state or when products are loading */}
        {isAdmin && (productsLoading || displayProducts.length > 0) && (
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
