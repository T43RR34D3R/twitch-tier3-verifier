import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Test the client credentials with Twitch
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        grant_type: "client_credentials",
      }),
    })

    const data = await response.json()

    return NextResponse.json({
      status: response.status,
      success: response.ok,
      data: data,
      clientId: process.env.TWITCH_CLIENT_ID,
      secretLength: process.env.TWITCH_CLIENT_SECRET?.length,
    })
  } catch {
    return NextResponse.json({ error: "Failed to test credentials" }, { status: 500 })
  }
}
