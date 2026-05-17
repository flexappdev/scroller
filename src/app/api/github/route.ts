import { NextResponse } from "next/server";
import { getStars } from "@/lib/fetchers";

export const revalidate = 1800;

export async function GET() {
  try {
    const data = await getStars();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e), stars: [], truncated: true }, { status: 500 });
  }
}
