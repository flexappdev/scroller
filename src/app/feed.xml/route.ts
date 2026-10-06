import { listScrollerPacks } from "@/lib/scroller";

// MSB-034 — RSS of ScrollAI Daily and other Scroller packs, newest first.
// Feeds RSS-to-email and RSS-to-social tools so each daily links back here.

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://scroller-psi.vercel.app";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  const packs = (await listScrollerPacks())
    .map((p) => ({ ...p, updatedAt: (p.manifest as { updatedAt?: string }).updatedAt || "" }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 50);

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n` +
    `<title>Scroller · ScrollAI Daily</title>\n<link>${BASE_URL}</link>\n` +
    `<atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>\n` +
    `<description>Daily AI news and Top 100 lists as swipeable cards.</description>\n` +
    `<language>en-gb</language>\n` +
    packs
      .map((p) => {
        const url = `${BASE_URL}/scroller/${p.manifest.slug}`;
        const date = p.updatedAt ? `<pubDate>${new Date(p.updatedAt).toUTCString()}</pubDate>` : "";
        return (
          `<item><title>${esc(p.manifest.name)}</title><link>${esc(url)}</link><guid>${esc(url)}</guid>${date}` +
          `<description>${esc(p.manifest.tagline)}</description></item>`
        );
      })
      .join("\n") +
    `\n</channel>\n</rss>\n`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
