import { NextResponse } from "next/server";
import { getRandomPage, newSeed, parseSeed } from "@/lib/random-feed";

// Pages of the /random feed. Same seed + offset always returns the same cards.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const seed = parseSeed(url.searchParams.get("seed")) ?? newSeed();
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const limit = Number(url.searchParams.get("limit") ?? 20);
  const page = await getRandomPage({ seed, offset, limit });
  return NextResponse.json(page, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
