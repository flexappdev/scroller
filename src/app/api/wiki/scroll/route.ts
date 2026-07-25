import { NextResponse } from "next/server";
import { getWiki } from "@/lib/fetchers";

// v2.1: fetches a small batch of random Wikipedia articles for the mobile
// snap-scroll feed. Reads through the cached wiki bucket; picks a rotating
// window so subsequent calls don't return the same head slice.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const n = Math.max(1, Math.min(20, Number(url.searchParams.get("n") ?? 8)));
  try {
    const { items } = await getWiki(100);
    if (!items.length) return NextResponse.json({ items: [] });
    const offset = Math.floor(Math.random() * Math.max(1, items.length - n));
    return NextResponse.json({ items: items.slice(offset, offset + n) });
  } catch (err) {
    console.warn("[api/wiki/scroll] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ items: [] });
  }
}
