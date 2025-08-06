import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { getVerificationLogs, addVerificationLog } from "@/lib/database"

const ADMIN_USERS = ["TearReader", "BuckFoozle"];
const ADMIN_USER_IDS = ["1239758967", "269187200"];

// In-memory fallback for verification logs
let inMemoryLogs: Array<{
  id: string;
  user_name: string;
  user_id: string;
  created_at: string;
  success: boolean;
  message: string;
}> = [
  {
    id: "test-1",
    user_name: "TestUser",
    user_id: "123456",
    created_at: new Date().toISOString(),
    success: true,
    message: "Test verification log entry"
  }
];

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin
    const userName = token.name;
    const userId = token.sub;
    const isAdminByName = ADMIN_USERS.some(adminUser => 
      adminUser.toLowerCase() === (userName || "").toLowerCase()
    );
    const isAdminById = ADMIN_USER_IDS.includes(userId || "");
    const isAdmin = isAdminByName || isAdminById;
    
    console.log('Admin verification logs check:', { userName, userId, isAdminByName, isAdminById, isAdmin });
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Try to get verification logs from database, fallback to in-memory
    let logs;
    try {
      logs = await getVerificationLogs();
      if (!logs || logs.length === 0) {
        console.log('No database logs, using in-memory logs:', inMemoryLogs.length);
        logs = inMemoryLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
    } catch (error) {
      console.log('Database error, using in-memory logs:', error);
      logs = inMemoryLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return NextResponse.json({ logs })
    
  } catch (error) {
    console.error("Error fetching verification logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { userName, userId, success, message } = body

    // Try to add to database, also add to in-memory fallback
    const logData = {
      user_name: userName || "Unknown",
      user_id: userId || "Unknown",
      success: !!success,
      message: message || "No message"
    };

    let newLog;
    try {
      newLog = await addVerificationLog(logData);
    } catch (error) {
      console.log('Database add failed, using in-memory:', error);
    }

    // Always add to in-memory as backup
    const memoryLog = {
      id: Date.now().toString(),
      ...logData,
      created_at: new Date().toISOString()
    };
    inMemoryLogs.unshift(memoryLog);
    
    // Keep only last 100 logs in memory
    if (inMemoryLogs.length > 100) {
      inMemoryLogs = inMemoryLogs.slice(0, 100);
    }

    return NextResponse.json({ success: true, log: newLog || memoryLog })
    
  } catch (error) {
    console.error("Error adding verification log:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
