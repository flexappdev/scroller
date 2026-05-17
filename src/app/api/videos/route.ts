import { NextResponse } from "next/server";
import { getVideos } from "@/lib/fetchers";

export const revalidate = 600;

export async function GET() {
  try {
    const data = await getVideos();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e), videos: [], source: "" }, { status: 500 });
  }
}
