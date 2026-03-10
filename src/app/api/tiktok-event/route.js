import { NextResponse } from "next/server";

const TIKTOK_EVENTS_API = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

export async function POST(request) {
  try {
    const { payload, accessToken } = await request.json();

    if (!payload || !accessToken) {
      return NextResponse.json({ error: "Missing payload or accessToken" }, { status: 400 });
    }

    const response = await fetch(TIKTOK_EVENTS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("TikTok Events API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
