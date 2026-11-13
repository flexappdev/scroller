import type { Metadata } from "next";
import Link from "next/link";
import { getScrollerPack, listScrollerPacks, type ScrollerPack } from "@/lib/scroller";
import { SITE_NAME, absoluteUrl, jsonLdHtml, snippet } from "@/lib/seo";

// SEO wrapper for every Scroller pack: Open Graph, canonical URL, JSON-LD and
// a crawlable "more packs" block. Kept out of page.tsx so it merges cleanly
// with open PRs that change the feed itself.

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

const RELATED_LIMIT = 12;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pack = await getScrollerPack(slug);
  if (!pack) return { robots: { index: false } };

  const { name, tagline, description } = pack.manifest;
  const path = `/scroller/${pack.manifest.slug}`;
  const desc = snippet(description);
  return {
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName: SITE_NAME,
      title: name,
      description: tagline || desc,
    },
    twitter: { card: "summary_large_image", title: name, description: tagline || desc },
  };
}

function packTopic(pack: ScrollerPack): string {
  const m = pack.manifest as { topic?: string; slug: string };
  if (m.topic) return m.topic;
  if (m.slug.startsWith("news-") || m.slug.includes("ai-news")) return "ai-news";
  if (m.slug.startsWith("top-100-")) return "top-100";
  return "other";
}

/** Same-topic packs first, then everything else, newest first; never the current pack. */
function relatedPacks(current: ScrollerPack, all: ScrollerPack[]): ScrollerPack[] {
  const topic = packTopic(current);
  const others = all.filter((p) => p.manifest.slug !== current.manifest.slug);
  const updated = (p: ScrollerPack) =>
    ((p.manifest as { updatedAt?: string; generated?: string }).updatedAt ||
      (p.manifest as { generated?: string }).generated ||
      "") as string;
  const byDate = (a: ScrollerPack, b: ScrollerPack) => updated(b).localeCompare(updated(a));
  const same = others.filter((p) => packTopic(p) === topic).sort(byDate);
  const rest = others.filter((p) => packTopic(p) !== topic).sort(byDate);
  return [...same, ...rest].slice(0, RELATED_LIMIT);
}

export default async function ScrollerPackLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const [pack, all] = await Promise.all([getScrollerPack(slug), listScrollerPacks().catch(() => [])]);
  if (!pack) return children;

  const url = absoluteUrl(`/scroller/${pack.manifest.slug}`);
  const related = relatedPacks(pack, all);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        url,
        name: pack.manifest.name,
        description: pack.manifest.description,
        inLanguage: "en-GB",
        isPartOf: { "@id": `${absoluteUrl("/")}#website` },
        mainEntity: {
          "@type": "ItemList",
          name: pack.manifest.name,
          numberOfItems: pack.items.length,
          itemListElement: pack.items.slice(0, 100).map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.title,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Scrollers", item: absoluteUrl("/scroller") },
          { "@type": "ListItem", position: 3, name: pack.manifest.name, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(jsonLd)} />
      {children}
      {related.length > 0 ? (
        <nav aria-labelledby="more-scrollers" className="bg-zinc-950 px-5 pb-32 pt-12 text-white md:px-10">
          <div className="mx-auto max-w-6xl">
            <h2 id="more-scrollers" className="text-2xl font-semibold tracking-tight">
              More to scroll
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.manifest.slug}>
                  <Link
                    href={`/scroller/${p.manifest.slug}`}
                    className="block h-full rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-pink-400/60"
                  >
                    <span className="block font-semibold">{p.manifest.name}</span>
                    <span className="mt-2 block text-sm leading-6 text-white/60">{p.manifest.tagline}</span>
                    <span className="mt-3 block text-xs uppercase tracking-wider text-pink-400">
                      {p.items.length} cards
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-white/60">
              <Link href="/top100" className="underline underline-offset-4 hover:text-white">
                All Top 100 lists
              </Link>
              {" · "}
              <Link href="/daily" className="underline underline-offset-4 hover:text-white">
                ScrollAI Daily
              </Link>
              {" · "}
              <Link href="/explore" className="underline underline-offset-4 hover:text-white">
                Explore every source
              </Link>
            </p>
          </div>
        </nav>
      ) : null}
    </>
  );
}
