import type { WikiFullDoc, WikiMedia, WikiSection } from "./types";

const USER_AGENT =
  "Scroller/0.4 (+https://scroller-psi.vercel.app; claude@cleverfox-ai.com)";
const FETCH_TIMEOUT_MS = 10_000;
const MIN_EXTRACT_LEN = 80;

function api(lang: string) {
  return `https://${lang}.wikipedia.org/w/api.php`;
}
function rest(lang: string) {
  return `https://${lang}.wikipedia.org/api/rest_v1`;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        ...init,
        signal: ac.signal,
        headers: {
          "User-Agent": USER_AGENT,
          accept: "application/json",
          ...(init?.headers || {}),
        },
        cache: "no-store",
      });
      clearTimeout(timer);
      if (res.ok) return (await res.json()) as T;
      if (res.status < 500) return null;
    } catch {
      clearTimeout(timer);
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 350));
  }
  return null;
}

async function fetchText(url: string, init?: RequestInit): Promise<string | null> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ac.signal,
      headers: { "User-Agent": USER_AGENT, ...(init?.headers || {}) },
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}

export function slugifyTitle(title: string): string {
  return title.replace(/ /g, "_");
}

interface SummaryResponse {
  pageid?: number;
  title?: string;
  displaytitle?: string;
  description?: string;
  extract?: string;
  thumbnail?: { source: string };
  originalimage?: { source: string };
  content_urls?: { desktop?: { page?: string } };
  type?: string;
  lang?: string;
}

interface SectionsResponse {
  parse?: {
    title?: string;
    sections?: Array<{
      toclevel: number;
      level: string;
      line: string;
      anchor: string;
      index: string;
    }>;
  };
}

interface MediaListResponse {
  items?: Array<{
    title: string;
    type: string;
    caption?: { text?: string };
    srcset?: Array<{ src: string; scale?: string }>;
    original?: { source: string };
    thumbnail?: { source: string };
  }>;
}

async function getSummary(
  titleOrPageid: string,
  lang: string,
): Promise<SummaryResponse | null> {
  const url = `${rest(lang)}/page/summary/${encodeURIComponent(titleOrPageid)}`;
  return fetchJson<SummaryResponse>(url);
}

async function getRandomSummary(lang: string): Promise<SummaryResponse | null> {
  return fetchJson<SummaryResponse>(`${rest(lang)}/page/random/summary`);
}

async function getSections(title: string, lang: string): Promise<WikiSection[]> {
  const url = `${api(lang)}?action=parse&format=json&prop=sections&origin=*&page=${encodeURIComponent(title)}`;
  const res = await fetchJson<SectionsResponse>(url);
  return (res?.parse?.sections ?? []).map((s) => ({
    toclevel: s.toclevel,
    level: s.level,
    line: s.line,
    anchor: s.anchor,
    index: s.index,
  }));
}

async function getMediaList(title: string, lang: string): Promise<WikiMedia[]> {
  const url = `${rest(lang)}/page/media-list/${encodeURIComponent(title)}`;
  const res = await fetchJson<MediaListResponse>(url);
  return (res?.items ?? []).map((m) => {
    const type = (m.type === "image" || m.type === "video" || m.type === "audio"
      ? m.type
      : "other") as WikiMedia["type"];
    return {
      title: m.title,
      type,
      caption: m.caption?.text,
      srcset: m.srcset,
      original: m.original?.source,
      thumbnail: m.thumbnail?.source,
    };
  });
}

async function getHtml(title: string, lang: string): Promise<string | null> {
  const url = `${rest(lang)}/page/html/${encodeURIComponent(title)}`;
  return fetchText(url);
}

interface FeaturedResponse {
  tfa?: {
    pageid?: number;
    title?: string;
    displaytitle?: string;
    description?: string;
    extract?: string;
    originalimage?: { source: string };
    thumbnail?: { source: string };
    content_urls?: { desktop?: { page?: string } };
  };
}

async function getFeaturedTitle(lang: string): Promise<string | null> {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const url = `${rest(lang)}/feed/featured/${y}/${m}/${day}`;
  const res = await fetchJson<FeaturedResponse>(url);
  return res?.tfa?.title ?? null;
}

interface CategoryMembersResponse {
  query?: {
    categorymembers?: Array<{ pageid: number; ns: number; title: string }>;
  };
}

async function getCategoryMembers(
  category: string,
  lang: string,
  limit: number,
): Promise<string[]> {
  const cat = category.startsWith("Category:") ? category : `Category:${category}`;
  const url =
    `${api(lang)}?action=query&list=categorymembers&format=json&origin=*&cmlimit=${Math.min(500, limit)}` +
    `&cmnamespace=0&cmtitle=${encodeURIComponent(cat)}`;
  const res = await fetchJson<CategoryMembersResponse>(url);
  return (res?.query?.categorymembers ?? []).map((m) => m.title).slice(0, limit);
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function extractInfobox(html: string | null): Record<string, string> | null {
  if (!html) return null;
  const ibMatch = html.match(/<table[^>]*class="[^"]*infobox[^"]*"[\s\S]*?<\/table>/i);
  if (!ibMatch) return null;
  const rows = ibMatch[0].match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  const out: Record<string, string> = {};
  for (const r of rows) {
    const th = r.match(/<th[^>]*>([\s\S]*?)<\/th>/i);
    const td = r.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
    if (th && td) {
      const key = stripHtml(th[1]).trim().replace(/\s+/g, " ");
      const val = stripHtml(td[1]).trim().replace(/\s+/g, " ");
      if (key && val) out[key.slice(0, 80)] = val.slice(0, 400);
    }
  }
  return Object.keys(out).length ? out : null;
}

export interface FetchOptions {
  lang?: string;
  category?: string;
  includeHtml?: boolean;
  includeSections?: boolean;
  includeMedia?: boolean;
}

export async function fetchFullArticleByTitle(
  title: string,
  opts: FetchOptions = {},
): Promise<WikiFullDoc | null> {
  const lang = opts.lang ?? "en";
  const summary = await getSummary(title, lang);
  if (!summary || !summary.pageid || !summary.title) return null;
  if (summary.type === "disambiguation") return null;
  const extract = summary.extract ? stripHtml(summary.extract) : "";
  if (extract.length < MIN_EXTRACT_LEN) return null;

  const realTitle = summary.title;
  const [html, sections, media] = await Promise.all([
    opts.includeHtml !== false ? getHtml(realTitle, lang) : Promise.resolve(null),
    opts.includeSections !== false ? getSections(realTitle, lang) : Promise.resolve([]),
    opts.includeMedia !== false ? getMediaList(realTitle, lang) : Promise.resolve([]),
  ]);

  return {
    pageid: summary.pageid,
    title: stripHtml(summary.displaytitle || realTitle),
    slug: slugifyTitle(realTitle),
    lang,
    category: opts.category ?? "random",
    description: summary.description ? stripHtml(summary.description) : null,
    extract,
    source_url:
      summary.content_urls?.desktop?.page ??
      `https://${lang}.wikipedia.org/wiki/${slugifyTitle(realTitle)}`,
    lead_image_url: summary.originalimage?.source ?? summary.thumbnail?.source ?? null,
    html,
    sections,
    media,
    infobox: extractInfobox(html),
    read_mins: Math.max(1, Math.ceil(extract.length / 800)),
    word_count: wordCount(extract),
    fetched_at: new Date().toISOString(),
  };
}

export async function fetchRandomTitles(n: number, lang: string): Promise<string[]> {
  const titles: string[] = [];
  const seen = new Set<string>();
  const overFetch = Math.ceil(n * 1.3);
  const summaries = await Promise.all(
    Array.from({ length: overFetch }, () => getRandomSummary(lang)),
  );
  for (const s of summaries) {
    if (!s?.title || s.type === "disambiguation") continue;
    if (seen.has(s.title)) continue;
    seen.add(s.title);
    titles.push(s.title);
    if (titles.length >= n) break;
  }
  return titles;
}

export async function fetchCategoryTitles(
  category: string,
  n: number,
  lang: string,
): Promise<string[]> {
  return getCategoryMembers(category, lang, n);
}

export async function fetchFeaturedTitle(lang: string): Promise<string | null> {
  return getFeaturedTitle(lang);
}

export interface SearchSuggestion {
  title: string;
  description: string;
  url: string;
}

export async function fetchSearchSuggestions(
  q: string,
  lang = "en",
): Promise<SearchSuggestion[]> {
  const query = q.trim();
  if (!query) return [];
  const url =
    `${api(lang)}?action=opensearch&format=json&namespace=0&origin=*&limit=8&search=` +
    encodeURIComponent(query);
  const data = await fetchJson<[string, string[], string[], string[]]>(url);
  if (!data) return [];
  const [, titles, descriptions, urls] = data;
  return titles.map((title, i) => ({
    title,
    description: descriptions[i] ?? "",
    url: urls[i] ?? "",
  }));
}
