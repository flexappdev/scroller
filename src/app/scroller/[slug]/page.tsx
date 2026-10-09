import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ScrollerFeed from "@/components/scroller/ScrollerFeed";
import { getScrollerPack, listScrollerPacks } from "@/lib/scroller";
import { isScrollerLoggedIn } from "@/lib/auth-state";
import { withAmazonTag } from "@/lib/scroll/amazon";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const packs = await listScrollerPacks();
  return packs.map(({ manifest }) => ({ slug: manifest.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pack = await getScrollerPack(slug);

  if (!pack) return {};

  return {
    title: `${pack.manifest.name} | Scroller`,
    description: pack.manifest.description,
    alternates: { canonical: `/scroller/${pack.manifest.slug}` },
  };
}

export default async function ScrollerPage({ params }: PageProps) {
  const { slug } = await params;
  const pack = await getScrollerPack(slug);

  if (!pack) notFound();

  const gateAfter = pack.manifest.monetization?.gateAfter;
  const visibleCount = gateAfter
    ? Math.min(Math.max(gateAfter, 1), pack.items.length)
    : pack.items.length;
  const loggedIn = await isScrollerLoggedIn();

  // Affiliate URLs are stored untagged; the Associates tag comes from env at render time.
  const manifest = pack.manifest.monetization
    ? {
        ...pack.manifest,
        monetization: { ...pack.manifest.monetization, ctaUrl: withAmazonTag(pack.manifest.monetization.ctaUrl) },
      }
    : pack.manifest;
  const items = pack.items.slice(0, visibleCount).map((item) =>
    item.cta ? { ...item, cta: { ...item.cta, url: withAmazonTag(item.cta.url) } } : item,
  );
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pack.manifest.name,
    description: pack.manifest.description,
    numberOfItems: pack.items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      ...(item.source ? { url: item.source } : {}),
    })),
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c") }}
    />
    <ScrollerFeed
      manifest={manifest}
      items={items}
      totalCount={pack.items.length}
      showAds={!loggedIn}
      adsenseClient={process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || null}
      adsenseSlot={process.env.NEXT_PUBLIC_ADSENSE_FEED_SLOT?.trim() || null}
    />
    </>
  );
}
