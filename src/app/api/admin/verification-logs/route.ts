import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { getVerificationLogs, addVerificationLog } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin (only TearReader for now)
    if (token.name !== "TearReader") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get verification logs from persistent storage (already sorted by created_at DESC)
    const logs = await getVerificationLogs()

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

    // Add new verification log using persistent storage
    const newLog = await addVerificationLog({
      user_name: userName || "Unknown",
      user_id: userId || "Unknown",
      success: !!success,
      message: message || "No message"
    })

    return NextResponse.json({ success: true, log: newLog })
    
  } catch (error) {
    console.error("Error adding verification log:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
