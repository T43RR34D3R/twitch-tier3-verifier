import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { query } from "@/lib/railway-db";

// Check if user is admin using environment variable with hardcoded fallback
const isUserAdmin = (userId?: string) => {
  const hardcodedAdminIds = ['441862265', '269187200'];
  const envAdmin = userId === process.env.ADMIN_USER_ID || userId === process.env.ADMIN_USER_ID_2;
  const hardcodedAdmin = hardcodedAdminIds.includes(userId || '');
  return envAdmin || hardcodedAdmin;
};

export async function GET() {
  try {
    // Load settings from database
    const settingsQuery = `
      SELECT settings, menu_items, home_sections 
      FROM customization_settings 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;
    
    const result = await query(settingsQuery);
    
    if (result.rows.length === 0) {
      // Return defaults if no settings found
      const defaultData = {
        settings: {
          siteTitle: "BuckFoozle",
          siteLogo: "👑",
          logoType: "emoji",
          tagline: "Variety Streamer & Content Creator",
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
          taglineAlignment: "left",
          footerText: "Made with 💜 for the Best Friends Club",
          footerLinkText: "twitch.tv/buckfoozle",
          footerLinkUrl: "https://twitch.tv/buckfoozle",
        },
        menuItems: [
          { id: "1", label: "Home", url: "/", iconType: "emoji", iconValue: "🏠", visibility: "all", isExternal: false, openInNewTab: false, orderIndex: 1, isEnabled: true },
          { id: "2", label: "Watch Live", url: "https://twitch.tv/buckfoozle", iconType: "emoji", iconValue: "📺", visibility: "all", isExternal: true, openInNewTab: true, orderIndex: 2, isEnabled: true },
          { id: "3", label: "Discord", url: "https://discord.gg/buckfoozle", iconType: "emoji", iconValue: "💬", visibility: "all", isExternal: true, openInNewTab: true, orderIndex: 3, isEnabled: true },
          { id: "4", label: "Twitter", url: "https://twitter.com/buckfoozle", iconType: "emoji", iconValue: "🐦", visibility: "all", isExternal: true, openInNewTab: true, orderIndex: 4, isEnabled: true },
          { id: "5", label: "YouTube", url: "https://youtube.com/@buckfoozle", iconType: "emoji", iconValue: "📹", visibility: "all", isExternal: true, openInNewTab: true, orderIndex: 5, isEnabled: true },
          { id: "6", label: "Admin Panel", url: "/admin", iconType: "emoji", iconValue: "⚙️", visibility: "admin", isExternal: false, openInNewTab: false, orderIndex: 6, isEnabled: true },
        ],
        homeSections: [
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
              aboutImage: "/buckfoozle-profile.jpg",
              aboutImagePosition: "left"
            }
          },
          {
            id: "twitch",
            type: "twitch-embed",
            title: "Twitch Stream",
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
        ]
      };
      
      return NextResponse.json(defaultData);
    }

    const row = result.rows[0];
    return NextResponse.json({
      settings: row.settings,
      menuItems: row.menu_items,
      homeSections: row.home_sections
    });
  } catch (error) {
    console.error("Error fetching customization settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch customization settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || !isUserAdmin(token.sub)) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const { settings, menuItems, homeSections } = await request.json();

    if (!settings || !menuItems || !homeSections) {
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 });
    }

    console.log('Saving customization settings to database');

    // Save to database using upsert pattern
    const upsertSql = `
      DO $$
      BEGIN
        -- Check if any settings exist
        IF EXISTS (SELECT 1 FROM customization_settings) THEN
          -- Update existing
          UPDATE customization_settings SET
            settings = $1,
            menu_items = $2,
            home_sections = $3,
            updated_by = $4,
            version = version + 1,
            updated_at = NOW()
          WHERE id = (SELECT id FROM customization_settings ORDER BY updated_at DESC LIMIT 1);
        ELSE
          -- Insert new
          INSERT INTO customization_settings (settings, menu_items, home_sections, updated_by)
          VALUES ($1, $2, $3, $4);
        END IF;
      END $$;
    `;

    await query(upsertSql, [
      JSON.stringify(settings),
      JSON.stringify(menuItems), 
      JSON.stringify(homeSections),
      token.sub
    ]);

    return NextResponse.json({ 
      success: true, 
      message: "Customization settings saved successfully to database" 
    });
  } catch (error) {
    console.error("Error saving customization settings:", error);
    return NextResponse.json(
      { error: "Failed to save customization settings" },
      { status: 500 }
    );
  }
}
