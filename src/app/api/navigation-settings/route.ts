import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { queryRow } from "@/lib/railway-db"

const ADMIN_USERS = ["TearReader", "BuckFoozle"];
const ADMIN_USER_IDS = ["1239758967", "269187200"];

interface NavigationItem {
  id?: string;
  label: string;
  icon?: string;
  url: string;
  access: 'all' | 'authenticated' | 'unauthenticated';
  order: number;
  enabled: boolean;
}

interface NavigationSettings {
  id?: string;
  site_title: string;
  site_icon?: string;
  background_type: 'gradient' | 'image' | 'solid';
  background_value: string;
  theme: 'light' | 'dark' | 'auto';
  menu_items: NavigationItem[];
  updated_at?: string;
}

async function checkAdminAccess(request: NextRequest): Promise<boolean> {
  try {
    const token = await getToken({ req: request })
    if (!token) return false;
    
    const userName = token.name;
    const userId = token.sub;
    
    const isAdminByName = ADMIN_USERS.some(adminUser => 
      adminUser.toLowerCase() === (userName || "").toLowerCase()
    );
    const isAdminById = ADMIN_USER_IDS.includes(userId || "");
    
    return isAdminByName || isAdminById;
  } catch (error) {
    console.error("Error checking admin access:", error);
    return false;
  }
}

async function getDefaultNavigationSettings(): Promise<NavigationSettings> {
  return {
    site_title: "Tier 3 Toolkit",
    site_icon: "🎮",
    background_type: "gradient",
    background_value: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
    theme: "dark",
    menu_items: [
      {
        label: "Home",
        icon: "🏠",
        url: "/",
        access: "all",
        order: 1,
        enabled: true
      },
      {
        label: "Verify T3",
        icon: "✅",
        url: "/t3verify",
        access: "all",
        order: 2,
        enabled: true
      },
      {
        label: "Analytics",
        icon: "📊",
        url: "/analytics",
        access: "authenticated",
        order: 3,
        enabled: true
      },
      {
        label: "Admin",
        icon: "⚙️",
        url: "/admin",
        access: "authenticated",
        order: 4,
        enabled: true
      }
    ]
  };
}

export async function GET() {
  try {
    const settings = await queryRow(`
      SELECT * FROM navigation_settings 
      ORDER BY updated_at DESC 
      LIMIT 1
    `);
    
    if (settings) {
      // Parse menu_items if it's stored as JSON string
      if (typeof settings.menu_items === 'string') {
        settings.menu_items = JSON.parse(settings.menu_items);
      }
      return NextResponse.json({ settings });
    } else {
      const defaultSettings = await getDefaultNavigationSettings();
      return NextResponse.json({ settings: defaultSettings });
    }
  } catch (error) {
    console.error("Error fetching navigation settings:", error);
    const defaultSettings = await getDefaultNavigationSettings();
    return NextResponse.json({ settings: defaultSettings });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await checkAdminAccess(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const settings: NavigationSettings = await request.json();
    
    // Validate required fields
    if (!settings.site_title) {
      return NextResponse.json({ error: "Site title is required" }, { status: 400 });
    }

    // Check if settings exist
    const existing = await queryRow('SELECT id FROM navigation_settings LIMIT 1');
    
    if (existing) {
      // Update existing settings
      await queryRow(`
        UPDATE navigation_settings SET 
        site_title = $1,
        site_icon = $2,
        background_type = $3,
        background_value = $4,
        theme = $5,
        menu_items = $6,
        updated_at = NOW()
        WHERE id = $7
      `, [
        settings.site_title,
        settings.site_icon,
        settings.background_type,
        settings.background_value,
        settings.theme,
        JSON.stringify(settings.menu_items),
        existing.id
      ]);
    } else {
      // Insert new settings
      await queryRow(`
        INSERT INTO navigation_settings 
        (site_title, site_icon, background_type, background_value, theme, menu_items)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        settings.site_title,
        settings.site_icon,
        settings.background_type,
        settings.background_value,
        settings.theme,
        JSON.stringify(settings.menu_items)
      ]);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving navigation settings:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
