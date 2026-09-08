/**
 * site.config.ts schema for @fleet/scroller consumers.
 * PBI-S-3 in ~/.claude/plans/staus-of-all-apps-groovy-turing.md.
 */

import type { ContentItemKind } from "./types/ContentItem";

export interface BrandTokens {
  name: string;
  accent: string;
  logo?: string;
  themeDefault?: "light" | "dark";
}

export interface NavItem {
  id: "home" | "explore" | "create" | "saved" | "me" | string;
  label: string;
  href: string;
  icon?: string;
}

export interface MonetisationFlags {
  ga4Id?: string;
  stripeEnabled?: boolean;
  adsenseSlot?: string;
  affiliateTag?: string;
}

export interface SiteConfig {
  id: string;
  brand: BrandTokens;
  sources: ContentItemKind[];
  nav: NavItem[];
  monetisation?: MonetisationFlags;
  baseUrl: string;
}

/** Identity helper for authoring a site.config.ts with type-checking. */
export function defineSite<T extends SiteConfig>(config: T): T {
  return config;
}

let _site: SiteConfig | null = null;

/** Register the active site.config at process start (e.g. in root layout). */
export function registerSite(config: SiteConfig): void {
  _site = config;
}

/** Read the active site config. Throws if registerSite() was not called. */
export function getSite(): SiteConfig {
  if (!_site) {
    throw new Error("[@fleet/scroller] getSite() called before registerSite(). Call registerSite(siteConfig) in your root layout.");
  }
  return _site;
}
