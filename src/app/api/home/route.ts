import { NextRequest, NextResponse } from "next/server";
import { getHomePage } from "@/lib/home-feed";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const seed = Number(params.get("seed") || 0);
  const offset = Number(params.get("offset") || 0);
  const limit = Number(params.get("limit") || 40);

  try {
    const page = await getHomePage({
      seed: Number.isFinite(seed) ? seed : 0,
      offset: Number.isFinite(offset) ? offset : 0,
      limit: Number.isFinite(limit) ? limit : 40,
    });
    return NextResponse.json(page, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
    });
  } catch (error) {
    console.error("[home] feed page failed", error);
    return NextResponse.json({ items: [], nextOffset: null }, { status: 200 });
  }
}
