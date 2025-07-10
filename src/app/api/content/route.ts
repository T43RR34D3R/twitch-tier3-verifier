import { NextResponse } from "next/server";
import { getContent, updateContent } from "../../../../lib/content";

export async function GET() {
  try {
    const content = getContent();
    return NextResponse.json(content);
  } catch (error) {
    console.error("Error getting content:", error);
    return NextResponse.json({ error: "Failed to get content" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newContent = await request.json();
    const updatedContent = updateContent(newContent);
    return NextResponse.json(updatedContent);
  } catch (error) {
    console.error("Error updating content:", error);
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
  }
}
