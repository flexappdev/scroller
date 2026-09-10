// SiteConfig — one shape that describes any app running on the shared
// Scroller Engine. See docs/PRD-ALIGNMENT.md §13.
//
// Compatibility shim: the canonical schema now lives in
// `@fleet/scroller/config`. Every future site (LawAI, ArtAI, CVAI, WikiAI, ...)
// ships a `sites/<id>.config.ts` file that satisfies this schema. The engine
// reads brand/content/scroller/navigation and renders accordingly.
//
// New code should import from `@fleet/scroller` directly. This file exists so
// existing `@/lib/site-config` imports keep working.

export type {
  SiteConfig,
  BrandTokens as SiteBrand,
  ScrollerMode,
  SiteContent,
  SiteScroller,
  SiteNavigation,
} from "@fleet/scroller";
