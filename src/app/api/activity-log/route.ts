import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getActivityLog } from "../../../../lib/userActivityLog";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Check if user is admin
    const allowedAdmins = ["TearReader", "BuckFoozle", "tearreader", "buckfoozle"];
    if (!allowedAdmins.includes(token?.name || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const activityLog = getActivityLog();
    return NextResponse.json(activityLog);
  } catch (error) {
    console.error("Error fetching activity log:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
