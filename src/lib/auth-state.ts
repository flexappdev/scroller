import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function isScrollerLoggedIn(): Promise<boolean> {
  const cookieStore = await cookies();

  if (
    process.env.NODE_ENV === "development" &&
    cookieStore.get("scroller-dev-bypass")?.value === "1"
  ) {
    return true;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return false;
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session?.user);
  } catch {
    return false;
  }
}
