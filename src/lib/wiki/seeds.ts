import { cmsAdmin, cmsAdminOrNull, isMissingTable } from "@/lib/cms/supabase";
import type { WikiSeed } from "./types";

export async function listSeeds(opts: { enabledOnly?: boolean } = {}): Promise<WikiSeed[]> {
  const supabase = cmsAdminOrNull();
  if (!supabase) return [];
  let q = supabase
    .from("scroller_wiki_seeds")
    .select("*")
    .order("priority", { ascending: true })
    .order("id", { ascending: true });
  if (opts.enabledOnly) q = q.eq("enabled", true);
  const { data, error } = await q;
  if (error) {
    if (isMissingTable(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as WikiSeed[];
}

export async function getSeed(id: string): Promise<WikiSeed | null> {
  const supabase = cmsAdminOrNull();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("scroller_wiki_seeds")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (isMissingTable(error)) return null;
    throw new Error(error.message);
  }
  return (data ?? null) as WikiSeed | null;
}

export async function upsertSeed(seed: Partial<WikiSeed> & { id: string }): Promise<WikiSeed> {
  const supabase = cmsAdmin();
  const payload = {
    id: seed.id,
    label: seed.label ?? seed.id,
    kind: seed.kind ?? "random",
    value: seed.value ?? null,
    lang: seed.lang ?? "en",
    max_pages: seed.max_pages ?? 25,
    priority: seed.priority ?? 100,
    enabled: seed.enabled ?? true,
    data: seed.data ?? {},
  };
  const { data, error } = await supabase
    .from("scroller_wiki_seeds")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as WikiSeed;
}

export async function deleteSeed(id: string): Promise<void> {
  const supabase = cmsAdmin();
  const { error } = await supabase.from("scroller_wiki_seeds").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
