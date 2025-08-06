import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { addVerificationLog, getVerificationLogs } from '@/lib/database';

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const adminIds = ['441862265', '269187200']; // Buckfoozle's IDs
  return adminIds.includes(userId);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admin users
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 });
    }

    console.log('Testing verification logs...');

    // Test adding a verification log
    const testLog = {
      user_name: "TestUser_" + Date.now(),
      user_id: "test_" + Date.now(),
      success: true,
      message: "Test verification log created from debug endpoint at " + new Date().toISOString()
    };

    console.log('Adding test log:', testLog);
    const addResult = await addVerificationLog(testLog);
    console.log('Add result:', addResult);

    // Test getting verification logs
    console.log('Fetching verification logs...');
    const logs = await getVerificationLogs();
    console.log('Fetched logs count:', logs.length);

    return NextResponse.json({
      success: true,
      message: "Debug test completed",
      data: {
        testLogAdded: !!addResult,
        addResult: addResult,
        totalLogs: logs.length,
        recentLogs: logs.slice(0, 5)
      }
    });

  } catch (error) {
    console.error('Debug verification logs error:', error);
    return NextResponse.json(
      { error: 'Failed to test verification logs: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admin users
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 });
    }

    const body = await request.json();
    const { message = "Manual test log" } = body;

    // Add a test verification log
    const testLog = {
      user_name: session.user.name || "Admin",
      user_id: session.user.id,
      success: true,
      message: message
    };

    console.log('Adding manual test log:', testLog);
    const result = await addVerificationLog(testLog);
    console.log('Manual test log result:', result);

    return NextResponse.json({
      success: true,
      message: "Manual test log added",
      log: result
    });

  } catch (error) {
    console.error('Error adding manual test log:', error);
    return NextResponse.json(
      { error: 'Failed to add test log: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
