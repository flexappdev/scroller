// wikai — knowledge / encyclopaedia channel (MSS-002, MSS-014).
// Served by flexappdev/wikai until the MSS-017 migration onto the shared engine.

import type { SiteConfig } from "@/lib/site-config";

const wikaiSite: SiteConfig = {
  id: "wikai",
  version: "2.3.0",
  brand: {
    name: "WIKAI",
    accent: "#ec4899",
    themeDefault: "dark",
    tagline: "Wikipedia, scrollable.",
  },
  content: {
    collection: "wikipedia",
    defaultLimit: 50,
    audience: "public",
  },
  scroller: {
    mode: "article",
    ranking: true,
    comments: false,
    audio: true,
    video: true,
    articles: true,
  },
  navigation: {
    home: true,
    explore: true,
    create: false,
    saved: true,
    profile: true,
  },
  sources: ["wiki"],
  monetisation: {
    feedAdEvery: 20,
    adsAnonymousOnly: true,
    affiliate: { provider: "amazon", every: 10, tagEnv: "NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG", marketplace: "www.amazon.co.uk" },
  },
  channel: {
    domains: ["wikai.tv", "www.wikai.tv"],
    defaultMode: "scroll",
    analyticsChannel: "wikai",
    servedBy: "flexappdev/wikai",
    features: { shorts: true, recallPoints: true, topics: true },
  },
  baseUrl: "https://www.wikai.tv",
};

export default wikaiSite;
