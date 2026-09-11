import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SCROLL_SOURCES } from "@/lib/scroll/sources";
import { getApps, getPrompts, getStars, getVideos, getWiki, getWikiVoyage } from "@/lib/fetchers";
import { getAmazonItems } from "@/lib/scroll/amazon";
import { getImageItems } from "@/lib/scroll/images";
import { getMediaiPage } from "@/lib/mediai";
import { listSites } from "@/lib/cms/sites";
import { funnyThings } from "@/lib/funny";

export const revalidate = 300;

export const metadata = {
  title: "Explore · Scroller",
  description: "Every source, live — asset counts and by-type breakdown.",
};

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch { return fallback; }
}

type Stat = { total: number; byType?: Record<string, number> };

export default async function ExplorePage() {
  const videos = await safe(getVideos, { videos: [], source: "" });
  const stars = await safe(getStars, { stars: [], truncated: false });
  const prompts = await safe(getPrompts, { prompts: [], source: "" });
  const apps = await safe(getApps, { apps: [], domains: [], target: 0 });
  const sites = await safe(() => listSites({ status: "published" }), []);
  const wiki = await safe(() => getWiki(100), { items: [] });
  const voyage = await safe(() => getWikiVoyage(100), { items: [] });
  const amazon = await safe(() => getAmazonItems({ limit: 500 }), { items: [], source: "", reachable: false });
  const images = await safe(() => getImageItems({ limit: 200 }), { items: [], nextCursor: null });
  const mediai = await safe(() => getMediaiPage({ rawLimit: 220 }), { items: [], nextOffset: null });

  const mediaiTypes = mediai.items.reduce(
    (acc, m) => {
      if (m.imageUrl) acc.image += 1;
      if (m.videoUrls?.length) acc.video += 1;
      if (m.audioUrl) acc.audio += 1;
      return acc;
    },
    { image: 0, video: 0, audio: 0 },
  );

  const realApps = apps.apps.filter((a) => !("placeholder" in a) || !a.placeholder);
  const stats: Record<string, Stat> = {
    mediai: { total: mediai.items.length, byType: mediaiTypes },
    "mediai-videos": { total: mediaiTypes.video },
    "mediai-audio": { total: mediaiTypes.audio },
    videos: { total: videos.videos.length },
    github: { total: stars.stars.length },
    prompts: { total: prompts.prompts.length },
    apps: { total: realApps.length },
    sites: { total: sites.length },
    wiki: { total: wiki.items.length },
    wikivoyage: { total: voyage.items.length },
    amazon: { total: amazon.items.length },
    images: { total: images.items.length },
    funny: { total: funnyThings.length },
  };

  const grand = Object.values(stats).reduce((n, s) => n + s.total, 0);
  const sources = SCROLL_SOURCES.filter((s) => s.id !== "all");

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 pb-28 sm:px-8">
      <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>Explore</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Every source, live.</h1>
      <p className="mt-3 text-sm" style={{ color: "var(--foreground-muted)" }}>
        <span className="font-mono tabular-nums" style={{ color: "var(--accent)" }}>{grand.toLocaleString()}</span> assets across {sources.length} sources.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((src) => {
          const s = stats[src.id] ?? { total: 0 };
          return (
            <Link
              key={src.id}
              href={src.href}
              className="group rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
              style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: src.accent }}>{src.id}</div>
                  <div className="mt-1 text-lg font-black">{src.label}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-2xl font-black tabular-nums" style={{ color: "var(--accent)" }}>{s.total.toLocaleString()}</div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>assets</div>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5" style={{ color: "var(--foreground-muted)" }}>{src.description}</p>

              {s.byType && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {Object.entries(s.byType).map(([k, v]) => (
                    <span key={k} className="rounded-full border px-2 py-0.5 text-[10px] font-mono" style={{ borderColor: "var(--border)", color: "var(--foreground-muted)" }}>
                      {k}: {v}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold group-hover:text-[var(--accent)]" style={{ color: "var(--foreground-muted)" }}>
                Open feed <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
