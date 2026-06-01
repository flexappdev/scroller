import { NextResponse } from "next/server";
import { listWikiIndex } from "@/lib/wiki/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? "30");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  try {
    const { rows, total } = await listWikiIndex({ category, q, limit, offset });
    return NextResponse.json({ rows, total, limit, offset });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
