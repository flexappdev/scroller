import { NextResponse } from "next/server";
import { listWikiCategories } from "@/lib/wiki/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await listWikiCategories();
    return NextResponse.json({ categories });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
