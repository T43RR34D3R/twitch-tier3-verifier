import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// This is a temporary in-memory store - in production you'd use a database
// eslint-disable-next-line prefer-const
let customizationData = {
  settings: {
    siteTitle: "BuckFoozle Toolkit",
    siteLogo: "🎮",
    logoType: "emoji",
    tagline: "Professional Streaming Tools",
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
  },
  menuItems: [
    { id: "1", label: "Home", url: "/", iconType: "emoji", iconValue: "🏠", visibility: "all", isExternal: false, openInNewTab: false, orderIndex: 1, isEnabled: true },
    { id: "2", label: "T3 Verification", url: "/t3verify", iconType: "emoji", iconValue: "👑", visibility: "all", isExternal: false, openInNewTab: false, orderIndex: 2, isEnabled: true },
    { id: "3", label: "Subathon Timer", url: "/subathon-timer", iconType: "emoji", iconValue: "⏰", visibility: "all", isExternal: false, openInNewTab: false, orderIndex: 3, isEnabled: true },
    { id: "4", label: "Analytics", url: "/analytics", iconType: "emoji", iconValue: "📊", visibility: "authenticated", isExternal: false, openInNewTab: false, orderIndex: 4, isEnabled: true },
    { id: "5", label: "Admin Panel", url: "/admin", iconType: "emoji", iconValue: "⚙️", visibility: "admin", isExternal: false, openInNewTab: false, orderIndex: 5, isEnabled: true },
    { id: "6", label: "Twitch Channel", url: "https://twitch.tv/buckfoozle", iconType: "emoji", iconValue: "💜", visibility: "all", isExternal: true, openInNewTab: true, orderIndex: 6, isEnabled: true },
  ],
  homeSections: [
    {
      id: "hero",
      type: "hero",
      title: "Hero Section",
      isEnabled: true,
      orderIndex: 1,
      content: {
        heroTitle: "Welcome to BuckFoozle Toolkit",
        heroSubtitle: "Professional streaming tools for content creators",
        heroImage: "",
        heroButtons: [
          { label: "Get Started", url: "/t3verify", style: "primary" },
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
        aboutText: "Professional streamer and content creator bringing you the best streaming tools and entertainment.",
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
        embedType: "both"
      }
    },
    {
      id: "tools",
      type: "tools",
      title: "Available Tools",
      isEnabled: true,
      orderIndex: 4,
      content: {
        toolsTitle: "Streaming Tools",
        showToolCards: true
      }
    }
  ]
};

// Check if user is admin
const isUserAdmin = (userName?: string | null, userId?: string) => {
  if (!userName && !userId) return false;
  const adminUsers = ["TearReader", "BuckFoozle"];
  const adminIds = ["1239758967", "269187200"];
  
  return adminUsers.some(admin => 
    admin.toLowerCase() === (userName || "").toLowerCase()
  ) || adminIds.includes(userId || "");
};

export async function GET() {
  try {
    return NextResponse.json(customizationData);
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
    
    if (!token || !isUserAdmin(token.name, token.sub)) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const { settings, menuItems, homeSections } = await request.json();

    // Update the in-memory store
    if (settings) {
      customizationData.settings = { ...customizationData.settings, ...settings };
    }
    if (menuItems) {
      customizationData.menuItems = menuItems;
    }
    if (homeSections) {
      customizationData.homeSections = homeSections;
    }

    return NextResponse.json({ 
      success: true, 
      message: "Customization settings saved successfully" 
    });
  } catch (error) {
    console.error("Error saving customization settings:", error);
    return NextResponse.json(
      { error: "Failed to save customization settings" },
      { status: 500 }
    );
  }
}
