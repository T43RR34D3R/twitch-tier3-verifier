import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// Import auth options - will get from getServerSession
import { sql } from '@vercel/postgres';

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
  // Fourthwall API integration
  fourthwallStoreId?: string;
  fourthwallApiKey?: string;
  autoSync: boolean;
  lastSyncAt?: string;
}

const defaultSettings: MerchSettings = {
  isEnabled: false,
  title: "Check Out My Merch!",
  subtitle: "Support the stream with some awesome gear!",
  maxItemsToShow: 6,
  layout: 'grid',
  showPrices: true,
  items: [],
  autoSync: false
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

async function ensureTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS merch_settings (
        id SERIAL PRIMARY KEY,
        settings JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
  } catch (error) {
    console.error('Error creating merch_settings table:', error);
  }
}

export async function GET() {
  try {
    await ensureTable();
    
    const result = await sql`
      SELECT settings FROM merch_settings ORDER BY updated_at DESC LIMIT 1
    `;
    
    if (result.rows.length === 0) {
      return NextResponse.json({ settings: defaultSettings });
    }
    
    return NextResponse.json({ 
      settings: { ...defaultSettings, ...result.rows[0].settings }
    });
  } catch (error) {
    console.error('Error fetching merch settings:', error);
    return NextResponse.json({ settings: defaultSettings });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!isUserAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const settings: MerchSettings = await request.json();
    
    // Validate settings
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' }, 
        { status: 400 }
      );
    }
    
    // Ensure required fields have defaults
    const validatedSettings: MerchSettings = {
      isEnabled: typeof settings.isEnabled === 'boolean' ? settings.isEnabled : false,
      title: typeof settings.title === 'string' ? settings.title : defaultSettings.title,
      subtitle: typeof settings.subtitle === 'string' ? settings.subtitle : defaultSettings.subtitle,
      maxItemsToShow: typeof settings.maxItemsToShow === 'number' ? Math.max(1, Math.min(20, settings.maxItemsToShow)) : defaultSettings.maxItemsToShow,
      layout: ['grid', 'carousel', 'list'].includes(settings.layout) ? settings.layout : defaultSettings.layout,
      showPrices: typeof settings.showPrices === 'boolean' ? settings.showPrices : defaultSettings.showPrices,
      items: Array.isArray(settings.items) ? settings.items.map((item: unknown, index: number) => {
        const typedItem = item as Record<string, unknown>;
        return {
          id: typeof typedItem.id === 'string' ? typedItem.id : `item-${Date.now()}-${index}`,
          title: typeof typedItem.title === 'string' ? typedItem.title : '',
          url: typeof typedItem.url === 'string' ? typedItem.url : '',
          imageUrl: typeof typedItem.imageUrl === 'string' ? typedItem.imageUrl : '',
          price: typeof typedItem.price === 'string' ? typedItem.price : '',
          isEnabled: typeof typedItem.isEnabled === 'boolean' ? typedItem.isEnabled : true,
          orderIndex: typeof typedItem.orderIndex === 'number' ? typedItem.orderIndex : index
        };
      }) : [],
      // Fourthwall integration properties
      fourthwallStoreId: typeof settings.fourthwallStoreId === 'string' ? settings.fourthwallStoreId : undefined,
      fourthwallApiKey: typeof settings.fourthwallApiKey === 'string' ? settings.fourthwallApiKey : undefined,
      autoSync: typeof settings.autoSync === 'boolean' ? settings.autoSync : defaultSettings.autoSync,
      lastSyncAt: typeof settings.lastSyncAt === 'string' ? settings.lastSyncAt : undefined
    };
    
    await ensureTable();
    
    // Delete old settings and insert new ones (or upsert if we want to keep history)
    await sql`DELETE FROM merch_settings`;
    await sql`
      INSERT INTO merch_settings (settings, updated_at) 
      VALUES (${JSON.stringify(validatedSettings)}, NOW())
    `;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Merch settings saved successfully',
      settings: validatedSettings
    });
  } catch (error) {
    console.error('Error saving merch settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' }, 
      { status: 500 }
    );
  }
}
