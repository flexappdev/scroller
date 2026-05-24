import { NextResponse } from "next/server";
import { getSite, upsertSite, deleteSite } from "@/lib/cms/sites";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw);
  try {
    const site = await getSite(id);
    if (!site) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ site });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw);
  try {
    const body = await request.json();
    const site = await upsertSite({
      id,
      title: body.title,
      url: body.url,
      description: body.description ?? null,
      category: body.category ?? "tech",
      accent: body.accent || null,
      favicon_url: body.favicon_url || null,
      status: body.status ?? "draft",
      sort_order: Number(body.sort_order ?? 0),
    });
    return NextResponse.json({ site });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw);
  try {
    await deleteSite(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
