import { getApps } from "@/lib/fetchers";
import MediaiFeed from "@/components/MediaiFeed";
import { cardToMediai } from "@/lib/scroll/toMediai";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Apps · Scroller",
  description: "Fullscreen fleet apps feed.",
};

export default async function AppsPage() {
  const { apps } = await getApps();
  const real = apps.filter((a) => !a.placeholder);
  const initial = {
    items: real.map((a) => cardToMediai({
      kind: "app", id: a.id, display_name: a.display_name, domain_name: a.domain_name, subdomain: a.subdomain, accent: a.accent,
    })),
    nextOffset: null,
  };
  return <MediaiFeed initial={initial} />;
}
