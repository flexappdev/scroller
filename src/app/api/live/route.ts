import { NextResponse } from "next/server";
import { getLiveDashboard } from "@/lib/live-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const snapshot = await getLiveDashboard();
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
