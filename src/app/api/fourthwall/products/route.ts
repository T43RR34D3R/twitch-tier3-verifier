import { NextRequest, NextResponse } from 'next/server';

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
  variants?: {
    id: string;
    name: string;
    price: {
      amount: number;
      currency: string;
    };
    available: boolean;
  }[];
}

interface FourthwallApiProduct {
  id: string;
  name: string;
  slug: string;
  price?: {
    amount: number;
    currency: string;
  };
  images?: {
    url: string;
    alt?: string;
  }[];
  description?: string;
  available?: boolean;
  variants?: {
    id: string;
    name: string;
    price?: {
      amount: number;
      currency: string;
    };
    available?: boolean;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeName = searchParams.get('storeName');
    
    if (!storeName) {
      return NextResponse.json(
        { error: 'Store name is required' },
        { status: 400 }
      );
    }

    // Use your Fourthwall Storefront API token
    const FOURTHWALL_TOKEN = 'ptkn_a28b6e63-1e1e-4583-aeb0-a33d65302b79';
    
    // Fetch products from Fourthwall API
    const response = await fetch(`https://api.fourthwall.com/v1/shops/${storeName}/products`, {
      headers: {
        'Authorization': `Bearer ${FOURTHWALL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Fourthwall API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch products from Fourthwall' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform the data to match our interface
    const products: FourthwallProduct[] = data.data?.map((product: FourthwallApiProduct) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: {
        amount: product.price?.amount || 0,
        currency: product.price?.currency || 'USD',
      },
      images: product.images?.map((img: { url: string; alt?: string }) => ({
        url: img.url,
        alt: img.alt || product.name,
      })) || [],
      description: product.description,
      available: product.available !== false,
      variants: product.variants?.map((variant: { id: string; name: string; price?: { amount: number; currency: string }; available?: boolean }) => ({
        id: variant.id,
        name: variant.name,
        price: {
          amount: variant.price?.amount || product.price?.amount || 0,
          currency: variant.price?.currency || product.price?.currency || 'USD',
        },
        available: variant.available !== false,
      })) || [],
    })) || [];

    return NextResponse.json({
      success: true,
      products,
      total: products.length,
    });

  } catch (error) {
    console.error('Error fetching Fourthwall products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
