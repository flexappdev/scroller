import { NextResponse } from "next/server";
import { runWikiConverter, syncOneTitle } from "@/lib/wiki/converter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // dev/local: allow unauth
  const url = new URL(req.url);
  const headerSecret =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    req.headers.get("x-cron-secret") ||
    url.searchParams.get("secret");
  return headerSecret === expected;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: { seedIds?: string[]; forceAll?: boolean; title?: string; category?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (body.title) {
    const r = await syncOneTitle(body.title, body.category ?? "manual");
    return NextResponse.json(r, { status: r.ok ? 200 : 502 });
  }
  const report = await runWikiConverter({
    seedIds: body.seedIds,
    forceAll: body.forceAll,
  });
  return NextResponse.json(report);
}

// Vercel Cron invokes via GET with the Bearer-secret header.
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const report = await runWikiConverter();
  return NextResponse.json(report);
}
