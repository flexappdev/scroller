// Site resolver — reads the active SiteConfig. Defaults to scroller.
// Future multi-tenant deployments switch by env var (SITE_ID) or subdomain.

import type { SiteConfig } from "./site-config";
import scrollerSite from "../../sites/scroller.config";

const REGISTRY: Record<string, SiteConfig> = {
  scroller: scrollerSite,
};

export function getSite(id: string = process.env.SITE_ID ?? "scroller"): SiteConfig {
  const site = REGISTRY[id];
  if (!site) throw new Error(`Unknown site id: ${id}`);
  return site;
}

export function listSites(): SiteConfig[] {
  return Object.values(REGISTRY);
}
