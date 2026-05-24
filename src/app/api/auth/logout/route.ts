import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = new URL(request.url);
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // ignore — also clear the dev-bypass cookie below
  }
  const res = NextResponse.redirect(`${url.origin}/`);
  res.cookies.set("scroller-dev-bypass", "", { path: "/", maxAge: 0 });
  return res;
}

export async function GET(request: Request) {
  return POST(request);
}
