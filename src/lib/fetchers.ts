import registry from "../../data/apps-registry.json";
import { DOMAINS, TARGET_APP_COUNT, domainForApp, proptypeForApp, subdomainForApp, type PropType } from "./taxonomy";

export type AppEntry = {
  id: string;
  display_name: string;
  monorepo: string | null;
  port_v1: number | null;
  port_v2: number | null;
  accent: string;
  domain: string;
  domain_name: string;
  subdomain: string;
  proptype: PropType;
  placeholder: boolean;
};

export async function getApps(): Promise<{ apps: AppEntry[]; domains: typeof DOMAINS; target: number }> {
  const data = registry as { apps: Array<Record<string, unknown>> };

  const real: AppEntry[] = (data.apps || []).map((a) => {
    const id = String(a.id);
    const monorepo = (a.monorepo as string | null) ?? null;
    const domain = domainForApp(monorepo);
    return {
      id,
      display_name: String(a.display_name ?? id),
      monorepo,
      port_v1: (a.port_v1 as number | null) ?? null,
      port_v2: (a.port_v2 as number | null) ?? null,
      accent: String(a.accent ?? domain.accent),
      domain: domain.id,
      domain_name: domain.name,
      subdomain: subdomainForApp(monorepo, id),
      proptype: proptypeForApp(id),
      placeholder: false,
    };
  });

  const placeholders: AppEntry[] = [];
  const need = Math.max(0, TARGET_APP_COUNT - real.length);
  for (let i = 0; i < need; i++) {
    const domain = DOMAINS[i % DOMAINS.length];
    const sub = domain.subdomains[i % domain.subdomains.length];
    placeholders.push({
      id: `slot-${i + 1}`,
      display_name: `Slot ${i + 1}`,
      monorepo: null,
      port_v1: null,
      port_v2: null,
      accent: domain.accent,
      domain: domain.id,
      domain_name: domain.name,
      subdomain: sub,
      proptype: "site",
      placeholder: true,
    });
  }

  return { apps: [...real, ...placeholders], domains: DOMAINS, target: TARGET_APP_COUNT };
}

export type Video = { id: string; title: string; url: string; published: string; thumbnail: string };

export async function getVideos(): Promise<{ videos: Video[]; source: string }> {
  const urls = [
    "https://www.youtube.com/feeds/videos.xml?channel_id=UC2lkM6tg_EVhsa-GV7XnORg",
    "https://www.youtube.com/feeds/videos.xml?user=mat-siems-production",
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { next: { revalidate: 600 } });
      if (!res.ok) continue;
      const xml = await res.text();
      const videos = parseYouTubeRSS(xml);
      if (videos.length) return { videos, source: url };
    } catch {}
  }
  return { videos: [], source: urls[0] };
}

function parseYouTubeRSS(xml: string): Video[] {
  const out: Video[] = [];
  const entries = xml.split("<entry>").slice(1);
  for (const e of entries) {
    const id = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(e)?.[1];
    const title = /<title>([^<]+)<\/title>/.exec(e)?.[1];
    const published = /<published>([^<]+)<\/published>/.exec(e)?.[1];
    const thumbnail = /<media:thumbnail\s+url="([^"]+)"/.exec(e)?.[1];
    if (id && title) {
      out.push({
        id,
        title,
        url: `https://www.youtube.com/watch?v=${id}`,
        published: published ?? "",
        thumbnail: thumbnail ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      });
    }
  }
  return out;
}

export type Star = {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  topics: string[];
};

export async function getStars(): Promise<{ stars: Star[]; truncated: boolean }> {
  const stars: Star[] = [];
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.mercy-preview+json",
    "User-Agent": "fad-v2",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  let truncated = false;
  for (let page = 1; page <= 5; page++) {
    const url = `https://api.github.com/users/flexappdev/starred?per_page=100&page=${page}`;
    const res = await fetch(url, { headers, next: { revalidate: 1800 } });
    if (!res.ok) {
      truncated = true;
      break;
    }
    const items = (await res.json()) as Array<Record<string, unknown>>;
    if (!items.length) break;
    for (const it of items) {
      stars.push({
        name: String(it.name ?? ""),
        full_name: String(it.full_name ?? ""),
        description: (it.description as string | null) ?? null,
        html_url: String(it.html_url ?? ""),
        language: (it.language as string | null) ?? null,
        stargazers_count: Number(it.stargazers_count ?? 0),
        topics: (it.topics as string[] | undefined) ?? [],
      });
    }
    if (items.length < 100) break;
  }
  return { stars, truncated };
}

export type Prompt = { act: string; prompt: string };

export async function getPrompts(): Promise<{ prompts: Prompt[]; source: string }> {
  const source = "https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv";
  const res = await fetch(source, { next: { revalidate: 3600 } });
  if (!res.ok) return { prompts: [], source };
  const csv = await res.text();
  const rows = parseCSV(csv);
  const prompts: Prompt[] = rows.slice(1, 101).map(([act, prompt]) => ({ act: act ?? "", prompt: prompt ?? "" }));
  return { prompts, source };
}

export type WikiCard = {
  id: string;
  title: string;
  extract: string;
  url: string;
  thumbnail: string | null;
  source: "wiki" | "wikivoyage";
};

async function fetchWikiRandom(host: "en.wikipedia.org" | "en.wikivoyage.org", count: number): Promise<WikiCard[]> {
  const source: "wiki" | "wikivoyage" = host.includes("voyage") ? "wikivoyage" : "wiki";

  // Use the Action API's `generator=random` to get N random page summaries in
  // a SINGLE request. Wikipedia caps `grnlimit` at 50 per call (500 for bots),
  // so we paginate with `gsrcontinue` if needed. Far more reliable than
  // hammering /api/rest_v1/page/random/summary in parallel.
  const out: WikiCard[] = [];
  const seen = new Set<string>();
  const headers = {
    "User-Agent": "scroller/0.4.0 (https://scroller-psi.vercel.app; mat@matsiems.com)",
    "Accept": "application/json",
  };

  let safety = 0;
  while (out.length < count && safety < 6) {
    safety++;
    const grnlimit = Math.min(50, Math.max(10, count - out.length + 5));
    const url =
      `https://${host}/w/api.php?` +
      `action=query&format=json&origin=*` +
      `&generator=random&grnnamespace=0&grnlimit=${grnlimit}` +
      `&prop=extracts|pageimages|info` +
      `&exintro=1&explaintext=1&exlimit=max` +
      `&piprop=thumbnail&pithumbsize=600` +
      `&inprop=url`;

    let json: unknown;
    try {
      const res = await fetch(url, { headers, cache: "no-store" });
      if (!res.ok) break;
      json = await res.json();
    } catch {
      break;
    }
    const pages = (json as { query?: { pages?: Record<string, {
      pageid: number;
      title: string;
      extract?: string;
      thumbnail?: { source: string };
      fullurl?: string;
    }> } })?.query?.pages;
    if (!pages) break;
    let addedThisRound = 0;
    for (const p of Object.values(pages)) {
      const id = String(p.pageid);
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({
        id,
        title: p.title,
        extract: p.extract ?? "",
        url: p.fullurl ?? `https://${host}/wiki/${encodeURIComponent(p.title)}`,
        thumbnail: p.thumbnail?.source ?? null,
        source,
      });
      addedThisRound++;
      if (out.length >= count) break;
    }
    if (addedThisRound === 0) break;
  }
  return out;
}

// Wikipedia cache. Two layers:
// 1. Next.js unstable_cache (shared across Vercel lambda instances via the
//    Next.js data cache, 10-min revalidate). Stored per (host, bucket).
// 2. Module-level fallback for environments where unstable_cache mis-behaves
//    (dev server HMR, etc).
//
// Bucket sizes: we cache big batches (BUCKET_SIZE) so single-source pages
// (?source=wiki, 100 items) and small mixed-feed home pages (12 items) all
// share the same cached batch.
import { unstable_cache } from "next/cache";

const BUCKET_SIZE = 100;
const WIKI_CACHE_REVALIDATE_S = 10 * 60;
const WIKI_CACHE_TTL_MS = WIKI_CACHE_REVALIDATE_S * 1000;

type WikiCache = { items: WikiCard[]; expires: number };
const wikiCache: { wiki: WikiCache | null; wikivoyage: WikiCache | null } = {
  wiki: null,
  wikivoyage: null,
};

// Next.js cache: keyed by host. Stores a single big bucket per host.
const fetchWikiBucket = unstable_cache(
  async (host: "en.wikipedia.org" | "en.wikivoyage.org"): Promise<WikiCard[]> => {
    return fetchWikiRandom(host, BUCKET_SIZE);
  },
  ["wiki-bucket-v2"],
  { revalidate: WIKI_CACHE_REVALIDATE_S, tags: ["wiki-bucket"] },
);

async function getWikiCached(host: "en.wikipedia.org" | "en.wikivoyage.org", count: number): Promise<WikiCard[]> {
  const key = host.includes("voyage") ? "wikivoyage" : "wiki";
  // Layer 1: module cache (cheapest, in-process). Skip if stale or too small.
  const c = wikiCache[key];
  if (c && c.expires > Date.now() && c.items.length >= count) {
    return c.items.slice(0, count);
  }
  // Layer 2: Next.js cache (shared across lambda instances on Vercel).
  let bucket: WikiCard[] = [];
  try {
    bucket = await fetchWikiBucket(host);
  } catch {
    bucket = [];
  }
  // Some throttled fetches return a short bucket. Merge with any module cache
  // so we don't shrink under sustained throttling.
  const existing = c?.items ?? [];
  let merged: WikiCard[];
  if (bucket.length >= existing.length) {
    merged = bucket;
  } else {
    const seen = new Set(existing.map((i) => i.id));
    merged = existing.concat(bucket.filter((i) => !seen.has(i.id)));
  }
  if (merged.length) {
    wikiCache[key] = { items: merged, expires: Date.now() + WIKI_CACHE_TTL_MS };
  }
  return merged.slice(0, count);
}

export async function getWiki(count = 100): Promise<{ items: WikiCard[] }> {
  return { items: await getWikiCached("en.wikipedia.org", count) };
}

export async function getWikiVoyage(count = 100): Promise<{ items: WikiCard[] }> {
  return { items: await getWikiCached("en.wikivoyage.org", count) };
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (c === "\r") {
        // skip
      } else {
        field += c;
      }
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
