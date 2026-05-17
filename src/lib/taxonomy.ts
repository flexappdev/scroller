export type Domain = {
  id: string;
  name: string;
  accent: string;
  subdomains: string[];
};

export const DOMAINS: Domain[] = [
  { id: "ai",        name: "AI",         accent: "#9333ea", subdomains: ["agents", "platforms", "models", "tools"] },
  { id: "media",     name: "Media",      accent: "#ec4899", subdomains: ["video", "audio", "images", "podcasts"] },
  { id: "travel",    name: "Travel",     accent: "#10b981", subdomains: ["cities", "stays", "guides", "trips"] },
  { id: "lists",     name: "Lists",      accent: "#f59e0b", subdomains: ["top100", "rankings", "directories"] },
  { id: "learning",  name: "Learning",   accent: "#3b82f6", subdomains: ["python", "javascript", "ai", "cad"] },
  { id: "backoffice",name: "Backoffice", accent: "#64748b", subdomains: ["dashboards", "registries", "ops"] },
  { id: "social",    name: "Social",     accent: "#ef4444", subdomains: ["content", "outreach", "scrollers"] },
  { id: "commerce",  name: "Commerce",   accent: "#22c55e", subdomains: ["shops", "deals", "directories"] },
  { id: "property",  name: "Property",   accent: "#06b6d4", subdomains: ["villas", "rentals", "investments"] },
  { id: "lifestyle", name: "Lifestyle",  accent: "#f97316", subdomains: ["food", "fitness", "fashion"] },
  { id: "research",  name: "Research",   accent: "#a855f7", subdomains: ["reports", "pages", "feeds"] },
  { id: "tools",     name: "Tools",      accent: "#84cc16", subdomains: ["cli", "scripts", "automations"] },
  { id: "personal",  name: "Personal",   accent: "#e11d48", subdomains: ["context", "journal", "memory"] },
];

export type PropType = "site" | "app" | "tool" | "service" | "feed";
export const PROPTYPES: PropType[] = ["site", "app", "tool", "service", "feed"];

const DOMAIN_BY_MONOREPO: Record<string, string> = {
  appai: "tools",
  mscore: "backoffice",
  mslists: "lists",
  mstravel: "travel",
  bta: "commerce",
  scrollerai: "social",
  agentai: "ai",
  personai: "personal",
  aicontext2026: "personal",
  villai: "property",
  cabinet: "media",
  cma: "media",
  ais: "ai",
  abc: "tools",
  cac: "learning",
  multica: "tools",
  paperclip: "tools",
};

const PROPTYPE_BY_ID: Record<string, PropType> = {
  appai: "tool",
  ms: "site",
  fad: "site",
};

export function domainForApp(monorepo: string | null | undefined): Domain {
  const id = (monorepo && DOMAIN_BY_MONOREPO[monorepo]) ?? "tools";
  return DOMAINS.find((d) => d.id === id) ?? DOMAINS[0];
}

export function proptypeForApp(id: string): PropType {
  return PROPTYPE_BY_ID[id] ?? "site";
}

export function subdomainForApp(monorepo: string | null | undefined, id: string): string {
  const domain = domainForApp(monorepo);
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return domain.subdomains[hash % domain.subdomains.length];
}

export const TARGET_APP_COUNT = 100;
