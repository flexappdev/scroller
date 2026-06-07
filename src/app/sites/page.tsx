import { listSites } from "@/lib/cms/sites";
import { getApps } from "@/lib/fetchers";
import SitesBrowser, { type SiteItem } from "@/components/SitesBrowser";
import { SCROLL_SOURCES } from "@/lib/scroll/sources";
import { liveUrl as fleetLiveUrl } from "@/lib/scroll/fleet-urls";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sites · Scroller",
  description: "The fleet, curated picks, and every scroll source.",
};

const S3_PUBLIC_BASE = "https://com27.s3.eu-west-2.amazonaws.com";

function screenshotFor(id: string): string {
  return `${S3_PUBLIC_BASE}/scroller/screenshots/${id}.png`;
}

export default async function PublicSitesPage() {
  const [{ apps }, curated] = await Promise.all([
    getApps(),
    listSites({ status: "published" }),
  ]);

  const fleetSites = apps.filter((a) => !a.placeholder && a.proptype === "site");

  const items: SiteItem[] = [];

  for (const a of fleetSites) {
    const liveUrl = fleetLiveUrl(a.id);
    items.push({
      id: `fleet:${a.id}`,
      title: a.display_name,
      description: `${a.domain_name} · ${a.subdomain} fleet site`,
      url: liveUrl,
      href: liveUrl,
      accent: a.accent,
      category: "Fleet",
      badge: a.id,
      thumbnail: screenshotFor(a.id),
    });
  }

  for (const s of curated) {
    items.push({
      id: `curated:${s.id}`,
      title: s.title,
      description: s.description,
      url: s.url,
      href: s.url,
      accent: s.accent ?? "#10b981",
      category: "Curated",
      badge: s.category,
      rank: s.sort_order,
      thumbnail: (s.data?.screenshot_url as string | undefined) ?? s.favicon_url ?? null,
    });
  }

  for (const src of SCROLL_SOURCES) {
    if (src.id === "all") continue;
    items.push({
      id: `source:${src.id}`,
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
