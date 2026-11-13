// mediai — generated and curated media channel (MSS-002, MSS-015).
// Served by flexappdev/mediai (static site + TV) until the MSS-017 migration.

import type { SiteConfig } from "@/lib/site-config";

const mediaiSite: SiteConfig = {
  id: "mediai",
  version: "0.8.0",
  brand: {
    name: "mediai",
    accent: "#10b981",
    themeDefault: "dark",
    tagline: "Every subject, every asset, one after another.",
  },
  content: {
    collection: "media_baseline",
    defaultLimit: 100,
    audience: "public",
  },
  scroller: {
    mode: "media",
    ranking: false,
    comments: false,
    audio: true,
    video: true,
    articles: false,
  },
  navigation: {
    home: true,
    explore: true,
    create: false,
    saved: true,
    profile: false,
  },
  monetisation: {
    feedAdEvery: 20,
    adsAnonymousOnly: true,
  },
  channel: {
    domains: ["mediai.tv", "www.mediai.tv"],
    defaultMode: "tv",
    analyticsChannel: "mediai",
    servedBy: "flexappdev/mediai",
    features: { tv: true },
  },
  baseUrl: "https://mediai.tv",
};

export default mediaiSite;
