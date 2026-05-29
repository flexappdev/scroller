import { NextResponse } from "next/server";
import { getImageItems } from "@/lib/scroll/images";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? 100);

  try {
    const { items, nextCursor } = await getImageItems({
      limit: Math.min(Math.max(limit, 1), 200),
      cursor,
    });
    return NextResponse.json({ items, nextCursor });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "list failed", items: [], nextCursor: null },
      { status: 500 },
    );
  }
}
