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

export default function MerchTestPage() {
  const [products, setProducts] = useState<FourthwallProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/fourthwall/products?storeName=thefoozles');
        if (!response.ok) {
          // If API fails, show mock data instead of error
          console.warn(`Fourthwall API failed (${response.status}), showing mock data instead`);
          
          // Mock data to demonstrate what the merch panel would look like
          const mockProducts: FourthwallProduct[] = [
            {
              id: "mock-1",
              name: "BuckFoozle Gaming T-Shirt",
              slug: "buckfoozle-gaming-tshirt",
              price: { amount: 2499, currency: "USD" }, // $24.99
              images: [{
                url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
                alt: "Gaming T-Shirt"
              }],
              description: "Comfortable gaming t-shirt for true streamers",
              available: true
            },
            {
              id: "mock-2",
              name: "Stream Squad Hoodie",
              slug: "stream-squad-hoodie",
              price: { amount: 3999, currency: "USD" }, // $39.99
              images: [{
                url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop",
                alt: "Stream Squad Hoodie"
              }],
              description: "Cozy hoodie for long streaming sessions",
              available: true
            },
            {
              id: "mock-3",
              name: "Gamer Fuel Mug",
              slug: "gamer-fuel-mug",
              price: { amount: 1599, currency: "USD" }, // $15.99
              images: [{
                url: "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop",
                alt: "Gaming Mug"
              }],
              description: "Perfect mug for your streaming setup",
              available: true
            },
            {
              id: "mock-4",
              name: "Stream Like a Pro Cap",
              slug: "stream-pro-cap",
              price: { amount: 1899, currency: "USD" }, // $18.99
              images: [{
                url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop",
                alt: "Gaming Cap"
              }],
              description: "Stylish cap for content creators",
              available: true
            },
            {
              id: "mock-5",
              name: "RGB Mousepad",
              slug: "rgb-mousepad",
              price: { amount: 2299, currency: "USD" }, // $22.99
              images: [{
                url: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop",
                alt: "RGB Mousepad"
              }],
              description: "Light-up mousepad for epic gaming",
              available: true
            },
            {
              id: "mock-6",
              name: "Stream Sticker Pack",
              slug: "stream-stickers",
              price: { amount: 899, currency: "USD" }, // $8.99
              images: [{
                url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
                alt: "Sticker Pack"
              }],
              description: "Collection of awesome stream stickers",
              available: true
            }
          ];
          
          setProducts(mockProducts);
          setError(`API Error: ${response.status} ${response.statusText} - Showing mock data instead`);
          return;
        }
        const data = await response.json();
        console.log('Fourthwall API Response:', data);
        setProducts(data.products || []);
      } catch (err) {
        console.error('Error loading products:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const formatPrice = (price: { amount: number; currency: string }) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency,
    }).format(price.amount / 100); // Fourthwall prices are in cents
  };

  const getProductUrl = (storeName: string, slug: string) => {
    return `https://fourthwall.com/shop/${storeName}/product/${slug}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Fourthwall Products Test</h1>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
              <p className="text-white">Loading products from Fourthwall...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Remove the error return block - we'll show error message but still display products

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">Fourthwall Products Test</h1>
        <p className="text-gray-300 mb-8">
          This page directly fetches and displays products from the Fourthwall API for store &quot;thefoozles&quot;
        </p>
        
        {error && (
          <div className="bg-orange-500/20 backdrop-blur-lg rounded-xl p-4 border border-orange-400/40 mb-6">
            <h3 className="text-orange-300 font-semibold mb-2">⚠️ API Issue Detected</h3>
            <p className="text-orange-200 text-sm mb-2">{error}</p>
            <p className="text-orange-200/80 text-xs">
              Don&apos;t worry! We&apos;re showing mock data so you can see how your merch panel would look.
            </p>
          </div>
        )}
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Found {products.length} products
          </h2>
          
          {products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-300 mb-2">No products found in the store.</p>
              <p className="text-sm text-gray-400">
                This could mean the store has no products, or they&apos;re not published/available.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <a
                  key={product.id}
                  href={getProductUrl('thefoozles', product.slug)}
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
                  <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-purple-300 font-bold text-lg">
                    {formatPrice(product.price)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {product.available ? '✅ Available' : '❌ Not Available'}
                  </p>
                </a>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-blue-500/20 backdrop-blur-lg rounded-xl p-4 border border-blue-400/40">
          <h3 className="text-blue-300 font-semibold mb-2">How to see this on your main site:</h3>
          <ol className="text-blue-200 text-sm space-y-1 list-decimal list-inside">
            <li>Go to <code className="bg-black/20 px-1 rounded">/admin</code> and log in</li>
            <li>Find the &quot;Merch Panel Admin&quot; section</li>
            <li>Enable the merch panel</li>
            <li>Set store name to &quot;thefoozles&quot;</li>
            <li>Enable auto sync</li>
            <li>Save settings</li>
            <li>Visit the home page to see the merch panel</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
