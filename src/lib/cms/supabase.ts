import { createClient as createSsrServerClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";

export type CmsClient = Awaited<ReturnType<typeof createSsrServerClient>>;

export async function cmsServer(): Promise<CmsClient> {
  return createSsrServerClient();
}

/**
 * Service-role client for public read APIs and admin tasks.
 * Falls back to anon key when SUPABASE_SERVICE_ROLE_KEY isn't set so dev still works.
 */
export function cmsAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase env missing: NEXT_PUBLIC_SUPABASE_URL + key required");
  }
  return createBrowserClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Same as cmsAdmin() but returns null instead of throwing when envs are absent.
 * Use in server components/routes that should degrade gracefully when Supabase
 * isn't wired (e.g. orphan Vercel deployments without env sync).
 */
export function cmsAdminOrNull(): ReturnType<typeof cmsAdmin> | null {
  try {
    return cmsAdmin();
  } catch {
    return null;
  }
}

/** PostgREST returns PGRST205 when a table hasn't been migrated yet — treat as empty. */
export function isMissingTable(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  if (err.code === "PGRST205") return true;
  return !!err.message && /Could not find the table/i.test(err.message);
}
