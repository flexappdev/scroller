import { NextResponse } from "next/server";
import { getPrompts } from "@/lib/fetchers";

export const revalidate = 3600;

export async function GET() {
  try {
    const data = await getPrompts();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e), prompts: [], source: "" }, { status: 500 });
  }
}
