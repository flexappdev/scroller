// scroller — the reference site config. First consumer of SiteConfig.
// See docs/PRD-ALIGNMENT.md §13.

import type { SiteConfig } from "@/lib/site-config";

const scrollerSite: SiteConfig = {
  id: "scroller",
  version: "4.0.0",
  brand: {
    name: "Scroller",
    accent: "#ec4899",
    tagline: "One immersive feed across the ABC fleet.",
  },
  content: {
    collection: "mediai",
    defaultLimit: 100,
    audience: "public",
  },
  scroller: {
    mode: "mixed",
    ranking: false,
    comments: false,
    audio: true,
    video: true,
    articles: true,
  },
  navigation: {
    home: true,
    explore: true,
    create: { label: "Ask MediaAI", href: "/create" },
    saved: true,
    profile: true,
  },
};

export default scrollerSite;
