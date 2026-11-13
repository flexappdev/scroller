// Shared SEO constants and JSON-LD builders for scroller.tv.
// NEXT_PUBLIC_SITE_URL overrides the canonical origin (e.g. on preview deploys).

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://scroller.tv").replace(/\/+$/, "");
export const SITE_NAME = "Scroller";
export const SITE_TAGLINE = "One feed. Every source.";

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Serialise JSON-LD safely for a <script> tag (no `</script>` break-outs). */
export function jsonLdHtml(data: unknown): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

/** Trim to a search-snippet friendly length on a word boundary. */
export function snippet(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20))}…`;
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_TAGLINE,
        inLanguage: "en-GB",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl("/icon.svg"),
      },
    ],
  };
}
