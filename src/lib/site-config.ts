// SiteConfig — one shape that describes any app running on the shared
// Scroller Engine. See docs/PRD-ALIGNMENT.md §13.
//
// Every future site (LawAI, ArtAI, CVAI, WikiAI, ...) ships a
// `sites/<id>.config.ts` file that satisfies this schema. The engine reads
// brand/content/scroller/navigation and renders accordingly.

export type ScrollerMode = "media" | "article" | "product" | "mixed";

export interface SiteBrand {
  name: string;
  accent: string;
  logo?: string;
  tagline?: string;
}

export interface SiteContent {
  collection: string;
  defaultLimit: number;
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
  brand: SiteBrand;
  content: SiteContent;
  scroller: SiteScroller;
  navigation: SiteNavigation;
}
