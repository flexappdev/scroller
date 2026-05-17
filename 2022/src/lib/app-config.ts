export const APP = {
  id: "scroller",
  name: "Scroller",
  long: "FAD scroller engine",
  tagline: "Drop in a JSON spec. Get a TikTok-style feed.",
  description:
    "A reusable vertical feed engine for any JSON-driven dataset. Bring 100 items, get an immediate randomised feed, optionally swap in your own spec via paste or upload, then export the result.",
  accent: "#ec4899",
  brandWarm: "#f472b6",
  themeKey: "scroller-theme",
  port: 13012,
  domain: "scroller",
};

export const NAV = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const FEATURES = [
  { title: "Feed", body: "Drop-in vertical feed, randomised on load.", anchor: "feed" },
  { title: "Specs", body: "JSON spec format — bring 100, get a feed.", anchor: "specs" },
  { title: "Import", body: "Paste or upload a spec to swap the feed.", anchor: "import" },
  { title: "Export", body: "Download the whole spec or a single item.", anchor: "export" },
  { title: "Random", body: "Deterministic-seedable shuffle for fair tests.", anchor: "random" },
  { title: "Inspect", body: "Peek into any feed item's raw JSON.", anchor: "inspect" },
] as const;

export const CATEGORIES = [
  "Feeds",
  "JSON",
  "Import",
  "Export",
  "Random",
  "Inspect",
] as const;
