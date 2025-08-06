import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getRecentLoginLogs, getUserLoginLogs, getLoginStats } from '@/lib/login-logger';

// Check if user is admin
const isUserAdmin = (userName?: string | null, userId?: string) => {
  if (!userName && !userId) return false;
  const adminUsers = ["TearReader", "BuckFoozle"];
  const adminIds = ["1239758967", "269187200"];
  
  return adminUsers.some(admin => 
    admin.toLowerCase() === (userName || "").toLowerCase()
  ) || adminIds.includes(userId || "");
};

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token || !isUserAdmin(token.name, token.sub)) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'recent';
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');

    let data;

    switch (action) {
      case 'stats':
        data = await getLoginStats();
        break;
      
      case 'user':
        if (!userId) {
          return NextResponse.json({ error: "User ID required for user logs" }, { status: 400 });
        }
        data = await getUserLoginLogs(userId, limit);
        break;
      
      case 'recent':
      default:
        data = await getRecentLoginLogs(limit);
        break;
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Login logs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch login logs' },
      { status: 500 }
    );
  }
}
