import type { MetadataRoute } from "next";
import { listSites } from "@/lib/cms/sites";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://scroller-psi.vercel.app";

const STATIC_PATHS = [
  { path: "/", priority: 1.0, changeFrequency: "daily" as const },
  { path: "/sites", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/apps", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/videos", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/github", priority: 0.7, changeFrequency: "daily" as const },
  { path: "/prompts", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.4, changeFrequency: "monthly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${BASE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  // Curated site detail pages — sourced from Supabase (returns [] if envs absent).
  let siteEntries: MetadataRoute.Sitemap = [];
  try {
    const sites = await listSites({ status: "published" });
    siteEntries = sites.map((s) => ({
      url: `${BASE_URL}/items/site:${encodeURIComponent(s.id)}`,
      lastModified: new Date(s.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // Supabase down or unmigrated — fall back to just static routes.
  }

  return [...staticEntries, ...siteEntries];
}
