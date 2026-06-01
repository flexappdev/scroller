import { NextResponse } from "next/server";
import { getWikiFullFromMongo, getWikiIndexByPageid } from "@/lib/wiki/storage";
import { fetchFullArticleByTitle } from "@/lib/wiki/fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const pageid = Number(id);
  if (!Number.isFinite(pageid) || pageid <= 0) {
    return NextResponse.json({ error: "invalid-pageid" }, { status: 400 });
  }
  const index = await getWikiIndexByPageid(pageid);
  const full = await getWikiFullFromMongo(pageid);

  if (full) return NextResponse.json({ index, full, source: "cache" });

  // Live fallback: if the article isn't cached yet, fetch on-demand by title (if index has it).
  if (index) {
    const live = await fetchFullArticleByTitle(index.title, {
      lang: index.lang,
      category: index.category,
    });
    if (live) return NextResponse.json({ index, full: live, source: "live" });
  }
  return NextResponse.json({ error: "not-found", index, full: null }, { status: 404 });
}
