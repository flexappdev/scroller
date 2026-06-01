"use server";

import { revalidatePath } from "next/cache";
import { deleteSeed, upsertSeed } from "@/lib/wiki/seeds";
import { runWikiConverter, syncOneTitle } from "@/lib/wiki/converter";
import type { WikiSeedKind } from "@/lib/wiki/types";

const VALID_KINDS: WikiSeedKind[] = ["random", "category", "featured", "pageid", "title"];

function parseKind(value: FormDataEntryValue | null): WikiSeedKind {
  const s = (value ?? "").toString();
  return (VALID_KINDS as string[]).includes(s) ? (s as WikiSeedKind) : "random";
}

export async function saveSeedAction(formData: FormData) {
  const id = (formData.get("id") ?? "").toString().trim();
  if (!id) throw new Error("seed id required");
  await upsertSeed({
    id,
    label: (formData.get("label") ?? id).toString(),
    kind: parseKind(formData.get("kind")),
    value: ((formData.get("value") ?? "").toString().trim() || null) as string | null,
    lang: ((formData.get("lang") ?? "en").toString().trim() || "en"),
    max_pages: Math.max(1, Math.min(200, Number(formData.get("max_pages") ?? 25))),
    priority: Number(formData.get("priority") ?? 100),
    enabled: formData.get("enabled") === "on",
  });
  revalidatePath("/admin/wiki");
}

export async function deleteSeedAction(formData: FormData) {
  const id = (formData.get("id") ?? "").toString().trim();
  if (!id) return;
  await deleteSeed(id);
  revalidatePath("/admin/wiki");
}

export async function runConverterAction(formData: FormData) {
  const onlyId = (formData.get("seed_id") ?? "").toString().trim();
  await runWikiConverter({
    seedIds: onlyId ? [onlyId] : undefined,
    forceAll: formData.get("force_all") === "on",
  });
  revalidatePath("/admin/wiki");
  revalidatePath("/wiki");
}

export async function syncOneAction(formData: FormData) {
  const title = (formData.get("title") ?? "").toString().trim();
  if (!title) return;
  const category = ((formData.get("category") ?? "manual").toString().trim() || "manual");
  await syncOneTitle(title, category);
  revalidatePath("/admin/wiki");
  revalidatePath("/wiki");
}
