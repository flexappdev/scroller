import { NextResponse } from "next/server";
import { listSites, upsertSite } from "@/lib/cms/sites";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") as "draft" | "published" | "all" | null) ?? "all";
  try {
    const sites = await listSites({ status });
    return NextResponse.json({ sites });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.id || !body?.title || !body?.url) {
      return NextResponse.json({ error: "id, title, url are required" }, { status: 400 });
    }
    const site = await upsertSite({
      id: String(body.id),
      title: String(body.title),
      url: String(body.url),
      description: body.description ?? null,
      category: body.category ?? "tech",
      accent: body.accent ?? null,
      favicon_url: body.favicon_url ?? null,
      status: body.status ?? "draft",
      sort_order: Number(body.sort_order ?? 0),
    });
    return NextResponse.json({ site }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
