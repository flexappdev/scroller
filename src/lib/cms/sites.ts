import { cmsAdmin, isMissingTable } from "./supabase";
import { mirrorUpsert, mirrorRemove } from "./mongo-mirror";

export interface SiteRow {
  id: string;                              // slug, e.g. "hn", "lobsters"
  title: string;
  url: string;
  description: string | null;
  category: string;                        // 'tech' | 'design' | 'travel' | 'news' | 'other'
  accent: string | null;                   // hex colour
  favicon_url: string | null;
  status: "draft" | "published";
  sort_order: number;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function listSites(opts: { status?: "draft" | "published" | "all" } = {}): Promise<SiteRow[]> {
  const supabase = cmsAdmin();
  const status = opts.status ?? "all";
  let q = supabase.from("scroller_sites").select("*").order("sort_order", { ascending: true }).order("title", { ascending: true });
  if (status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) {
    if (isMissingTable(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as SiteRow[];
}

export async function getSite(id: string): Promise<SiteRow | null> {
  const supabase = cmsAdmin();
  const { data, error } = await supabase.from("scroller_sites").select("*").eq("id", id).maybeSingle();
  if (error) {
    if (isMissingTable(error)) return null;
    throw new Error(error.message);
  }
  return (data ?? null) as SiteRow | null;
}

export async function upsertSite(row: Partial<SiteRow> & { id: string }): Promise<SiteRow> {
  const supabase = cmsAdmin();
  const now = new Date().toISOString();
  const payload = {
    id: row.id,
    title: row.title ?? row.id,
    url: row.url ?? "",
    description: row.description ?? null,
    category: row.category ?? "tech",
    accent: row.accent ?? null,
    favicon_url: row.favicon_url ?? null,
    status: row.status ?? "draft",
    sort_order: row.sort_order ?? 0,
    data: row.data ?? {},
    updated_at: now,
  };
  const { data, error } = await supabase
    .from("scroller_sites")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  await mirrorUpsert("SCROLLER_sites", data as Record<string, unknown>);
  return data as SiteRow;
}

export async function deleteSite(id: string): Promise<void> {
  const supabase = cmsAdmin();
  const { error } = await supabase.from("scroller_sites").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await mirrorRemove("SCROLLER_sites", { id });
}
