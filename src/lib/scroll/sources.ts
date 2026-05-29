export type ScrollSourceId =
  | "all"
  | "videos"
  | "github"
  | "prompts"
  | "apps"
  | "sites"
  | "wiki"
  | "wikivoyage";

export interface ScrollSource {
  id: ScrollSourceId;
  label: string;
  description: string;
  accent: string;
  href: string;
  external?: boolean;
}

export const SCROLL_SOURCES: ScrollSource[] = [
  { id: "all", label: "All", description: "Random feed across every scroll source.", accent: "#10b981", href: "/" },
  { id: "videos", label: "Videos", description: "@mat-siems-production on YouTube.", accent: "#ef4444", href: "/videos" },
  { id: "github", label: "GitHub", description: "Stars from @flexappdev.", accent: "#a78bfa", href: "/github" },
  { id: "prompts", label: "Prompts", description: "Top 100 AI prompts.", accent: "#f59e0b", href: "/prompts" },
  { id: "apps", label: "Apps", description: "Fleet apps catalogue.", accent: "#06b6d4", href: "/apps" },
  { id: "sites", label: "Sites", description: "Curated sites worth scrolling.", accent: "#10b981", href: "/sites" },
  { id: "wiki", label: "Wikipedia", description: "Random Wikipedia articles.", accent: "#e5e7eb", href: "/?source=wiki" },
  { id: "wikivoyage", label: "WikiVoyage", description: "Random WikiVoyage destinations.", accent: "#3b82f6", href: "/?source=wikivoyage" },
];

export function sourceById(id: string | undefined | null): ScrollSource {
  return SCROLL_SOURCES.find((s) => s.id === id) ?? SCROLL_SOURCES[0];
}
