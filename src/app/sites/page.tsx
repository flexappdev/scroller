import { listSites } from "@/lib/cms/sites";
import { getApps } from "@/lib/fetchers";
import SitesBrowser, { type SiteItem } from "@/components/SitesBrowser";
import { SCROLL_SOURCES } from "@/lib/scroll/sources";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sites · Scroller",
  description: "The fleet, curated picks, and every scroll source.",
};

// Known live URLs not yet sync'd into the bundled apps-registry snapshot.
// Source: memory snapshots from 2026-05-24 ship pass.
const FLEET_LIVE_URL_FALLBACKS: Record<string, string> = {
  fad: "https://fad-rosy.vercel.app",
  ms: "https://ms-lake-eta.vercel.app",
  yb100: "https://yb100-khaki.vercel.app",
  fs: "https://fs-sand.vercel.app",
  sp: "https://sp-eta-eight.vercel.app",
  xmas: "https://xmas-tan-omega.vercel.app",
  wbp: "https://wbp-eta.vercel.app",
  ybl: "https://ybl-one.vercel.app",
  fi: "https://fi-mu-three.vercel.app",
  mtd: "https://mtd-rose.vercel.app",
  scroller: "https://scroller-psi.vercel.app",
};

export default async function PublicSitesPage() {
  const [{ apps }, curated] = await Promise.all([
    getApps(),
    listSites({ status: "published" }),
  ]);

  const fleetSites = apps.filter((a) => !a.placeholder && a.proptype === "site");

  const items: SiteItem[] = [];

  // 1. Fleet — the 13 sites
  for (const a of fleetSites) {
    const liveUrl = FLEET_LIVE_URL_FALLBACKS[a.id] ?? `https://github.com/flexappdev/${a.id}`;
    items.push({
      id: `fleet-${a.id}`,
      title: a.display_name,
      description: `${a.domain_name} · ${a.subdomain} fleet site`,
      url: liveUrl,
      href: liveUrl,
      accent: a.accent,
      category: "Fleet",
      badge: a.id,
    });
  }

  // 2. Curated — scroller_sites from Supabase
  for (const s of curated) {
    items.push({
      id: `curated-${s.id}`,
      title: s.title,
      description: s.description,
      url: s.url,
      href: s.url,
      accent: s.accent ?? "#10b981",
      category: "Curated",
      badge: s.category,
    });
  }

  // 3. Sources — every scroll source as an internal link
  for (const src of SCROLL_SOURCES) {
    if (src.id === "all") continue;
    items.push({
      id: `source-${src.id}`,
      title: src.label,
      description: src.description,
      url: src.href,
      href: src.href,
      accent: src.accent,
      category: "Scroll sources",
      badge: src.id,
      internal: !src.external && src.href.startsWith("/"),
    });
  }

  return <SitesBrowser items={items} />;
}
