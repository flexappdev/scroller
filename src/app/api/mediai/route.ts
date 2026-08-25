import { NextRequest, NextResponse } from "next/server";
import { getMediaAiPage } from "@/lib/mediai";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const offset = Number(params.get("offset") || 0);
  const rawLimit = Number(params.get("limit") || 220);

  try {
    const page = await getMediaAiPage({
      offset: Number.isFinite(offset) ? offset : 0,
      rawLimit: Number.isFinite(rawLimit) ? rawLimit : 220,
    });

    return NextResponse.json(page, {
      headers: {
        "Cache-Control": "public, s-maxage=20, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("[mediai] feed query failed", error);
    return NextResponse.json({ items: [], nextOffset: null }, { status: 200 });
  }
}
