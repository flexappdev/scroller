/**
 * site.config.ts schema for @fleet/scroller consumers.
 * PBI-S-3 in ~/.claude/plans/staus-of-all-apps-groovy-turing.md.
 *
 * This is the CANONICAL SiteConfig shape. The app-side re-export at
 * `src/lib/site-config.ts` is a thin compatibility shim — do not diverge.
 * See docs/PRD-ALIGNMENT.md §13.
 */

import type { ContentItemKind } from "./types/ContentItem";

export interface BrandTokens {
  name: string;
  accent: string;
  logo?: string;
  themeDefault?: "light" | "dark";
  /** Short one-liner shown under the wordmark / in meta description. */
  tagline?: string;
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

export type ScrollerMode = "media" | "article" | "product" | "mixed";

export interface SiteContent {
  /** Mongo/S3 collection name this site pulls from. */
  collection: string;
  /** Default page size for feed queries. */
  defaultLimit: number;
  /** VaultAI audience gate. `"private"` is rejected in public app code. */
  audience?: "public" | "shared";
}

export interface SiteScroller {
  mode: ScrollerMode;
  ranking?: boolean;
  comments?: boolean;
  audio?: boolean;
  video?: boolean;
  articles?: boolean;
}

export interface SiteNavigation {
  home: boolean;
  explore: boolean;
  create: boolean | { label: string; href: string };
  saved: boolean;
  profile: boolean;
}

export interface SiteConfig {
  id: string;
  version?: string;
  brand: BrandTokens;
  /** Content pipeline config — collection + audience gate. */
  content?: SiteContent;
  /** Scroller feed capabilities. */
  scroller?: SiteScroller;
  /** Per-destination navigation flags (drives five-button nav). */
  navigation?: SiteNavigation;
  /** Explicit source kinds allowed in feed (if omitted, engine defaults). */
  sources?: ContentItemKind[];
  /** Explicit nav items (advanced override; usually derived from `navigation`). */
  nav?: NavItem[];
  monetisation?: MonetisationFlags;
  baseUrl?: string;
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
