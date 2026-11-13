// The three MS Scroll channels that /api/revenue reports on. Domains are the
// production hostnames; AdSense and GA4 report by these names.
export type RevenueSiteId = "scroller" | "wikai" | "mediai";

export type RevenueSite = {
  id: RevenueSiteId;
  domain: string;
  repo: string;
};

export const REVENUE_SITES: readonly RevenueSite[] = [
  { id: "scroller", domain: "scroller.tv", repo: "flexappdev/scroller" },
  { id: "wikai", domain: "wikai.tv", repo: "flexappdev/wikai" },
  { id: "mediai", domain: "mediai.tv", repo: "flexappdev/mediai" },
];

/** $1 → $10 → $100 per day gross, across all three sites (ABC BL-081 / BL-118). */
export const REVENUE_LADDER_USD = [1, 10, 100] as const;

export const ADSENSE_PUBLISHER_ID = process.env.ADSENSE_ACCOUNT_ID?.trim() || "pub-1457156776981797";

export function siteForHost(host: string | null | undefined): RevenueSite | undefined {
  if (!host) return undefined;
  const h = host.toLowerCase().replace(/^www\./, "");
  return REVENUE_SITES.find((site) => h === site.domain || h.endsWith(`.${site.domain}`));
}
