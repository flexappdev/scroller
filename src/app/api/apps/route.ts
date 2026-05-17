import { NextResponse } from "next/server";
import { getApps } from "@/lib/fetchers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getApps();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e), apps: [], domains: [], target: 0 }, { status: 500 });
  }
}
