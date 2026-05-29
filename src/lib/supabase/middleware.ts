import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export const ALLOWED_EMAILS = ["mat@matsiems.com"];

const PUBLIC_PREFIXES = [
  "/",
  "/about",
  "/apps",
  "/videos",
  "/github",
  "/prompts",
  "/scroller",
  "/sites",
  "/items",
  "/login",
  "/auth/callback",
  "/auth/error",
  "/api/public",
  "/api/apps",
  "/api/videos",
  "/api/github",
  "/api/prompts",
  "/api/scroll",
];

const ADMIN_LANDING = "/admin";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!supabaseUrl || !supabaseAnon) {
    // Env not configured (e.g. Vercel env push pending) — let public routes
    // render; gate /admin via a soft redirect instead of 500-ing the site.
    if (request.nextUrl.pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "?error=supabase-env-missing";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnon,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const devBypass =
    process.env.NODE_ENV === "development" &&
    request.cookies.get("scroller-dev-bypass")?.value === "1";

  let user: { id: string; email?: string | null } | null = null;
  if (!devBypass) {
    try {
      const { data } = await supabase.auth.getSession();
      user = data.session?.user ?? null;
    } catch {
      user = null;
    }
  }

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

  if (devBypass) {
    if (path === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_LANDING;
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (user && !ALLOWED_EMAILS.includes(user.email ?? "")) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "?error=unauthorized";
    return NextResponse.redirect(url);
  }

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (path !== "/") {
      url.searchParams.set("next", path);
    }
    return NextResponse.redirect(url);
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = ADMIN_LANDING;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
