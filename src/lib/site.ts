// Site resolver — reads the active SiteConfig (channel manifest, MSS-002).
// Resolution order: explicit id → SITE_ID env → request host → scroller.

import type { SiteConfig } from "./site-config";
import scrollerSite from "../../sites/scroller.config";
import wikaiSite from "../../sites/wikai.config";
import mediaiSite from "../../sites/mediai.config";

const REGISTRY: Record<string, SiteConfig> = {
  scroller: scrollerSite,
  wikai: wikaiSite,
  mediai: mediaiSite,
};

export function getSite(id: string = process.env.SITE_ID ?? "scroller"): SiteConfig {
  const site = REGISTRY[id];
  if (!site) throw new Error(`Unknown site id: ${id}`);
  return site;
}

/** Match a request Host header (port and case ignored) to a channel manifest. */
export function getSiteForHost(host: string | null | undefined): SiteConfig {
  const bare = (host ?? "").toLowerCase().split(":")[0];
  const match = Object.values(REGISTRY).find((site) => site.channel?.domains.includes(bare));
  return match ?? getSite();
}

export function listSites(): SiteConfig[] {
  return Object.values(REGISTRY);
}
