import { getApps } from "@/lib/fetchers";
import SourceHero from "@/components/SourceHero";
import AppsClient from "./AppsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Apps",
  description: "Fleet apps catalogue — every cleverfox/flexappdev site, grouped by domain.",
};

export default async function AppsPage() {
  const { apps, domains, target } = await getApps();
  const real = apps.filter((a) => !a.placeholder);

  return (
    <div className="space-y-8 p-8">
      <SourceHero
        source="apps"
        accent="#06b6d4"
        label="Scroller · Apps"
        title="Apps"
        subtitle={`Fleet apps catalogue from apps-registry.json. Each card carries an S3 screenshot. ${domains.length} domains, ${domains.reduce((n, d) => n + d.subdomains.length, 0)} subdomains.`}
        rightChip={`${real.length} live · ${target} target`}
      />
      <AppsClient apps={apps} />
    </div>
  );
}
