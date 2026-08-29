"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Blocks,
  BookOpen,
  Bookmark,
  ChevronDown,
  Cloud,
  Database,
  ExternalLink,
  Film,
  Github,
  Images,
  Laugh,
  Layers3,
  Radio,
  Rocket,
  ScrollText,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ComponentType } from "react";

type MenuName = "assets" | "publish" | null;

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  external?: boolean;
  priority?: boolean;
};

const ASSET_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Watch",
    items: [
      { href: "/", label: "MediaAI feed", description: "Generated image, motion and audio", icon: Radio },
      { href: "/browse", label: "All media", description: "Every Scroller source in one browser", icon: Layers3 },
      { href: "/videos", label: "Videos", description: "Mat Siems + Siems Production", icon: Film },
      { href: "/images", label: "Images", description: "Search the generated S3 image vault", icon: Images },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { href: "/wiki", label: "Wikipedia", description: "Cached articles and media", icon: BookOpen },
      { href: "/wikivoyage", label: "WikiVoyage", description: "Places, guides and travel assets", icon: ScrollText },
      { href: "/prompts", label: "Prompts", description: "Reusable AI prompt library", icon: Sparkles },
      { href: "/apps", label: "Apps", description: "FlexAppDev product fleet", icon: Blocks },
    ],
  },
  {
    label: "Sources",
    items: [
      { href: "/github", label: "GitHub stars", description: "Saved repos from FlexAppDev", icon: Github },
      { href: "/sites", label: "Sites", description: "Curated websites worth scrolling", icon: Bookmark },
      { href: "/amazon", label: "Amazon", description: "Ranked UK product picks", icon: ShoppingBag },
      { href: "/funny", label: "Funny 100", description: "Ranked ideas in four formats", icon: Laugh },
    ],
  },
  {
    label: "Stores",
    items: [
      { href: "/admin/s3", label: "S3 · com27", description: "Buckets, prefixes and raw assets", icon: Cloud },
      { href: "/admin/mongo", label: "MediaAI · Mongo", description: "AIDB media_baseline records", icon: Database },
      { href: "https://mediai-public.vercel.app", label: "MediaAI studio", description: "Public generated-media surface", icon: Radio, external: true },
      { href: "https://github.com/flexappdev/scroller", label: "Source code", description: "Scroller repository on GitHub", icon: Github, external: true },
    ],
  },
];

const PUBLISH_ITEMS: NavItem[] = [
  {
    href: "https://www.youtube.com/@mat-siems-production/search?query=gorai",
    label: "Gorai",
    description: "Persona videos on Siems Production",
    icon: Rocket,
    external: true,
    priority: true,
  },
  {
    href: "https://www.youtube.com/@mat-siems-production",
    label: "Siems Production",
    description: "Primary YouTube publishing channel",
    icon: Film,
    external: true,
    priority: true,
  },
  {
    href: "https://wikai.matsiems.com",
    label: "WIKAI",
    description: "Publish and read source articles",
    icon: BookOpen,
    external: true,
    priority: true,
  },
  {
    href: "https://mediai-public.vercel.app",
    label: "MediaAI",
    description: "Review generated media before release",
    icon: Radio,
    external: true,
  },
];

function NavItemLink({ item, onSelect }: { item: NavItem; onSelect: () => void }) {
  const Icon = item.icon;
  const className = `group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
    item.priority
      ? "border-[color-mix(in_oklch,var(--publish-accent)_42%,transparent)] bg-[color-mix(in_oklch,var(--publish-accent)_10%,transparent)]"
      : "border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-hover)]"
  }`;
  const content = (
    <>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
        style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          {item.label}
          {item.external && <ExternalLink className="h-3 w-3 opacity-45" />}
        </span>
        <span className="mt-0.5 block truncate text-[11px]" style={{ color: "var(--foreground-muted)" }}>
          {item.description}
        </span>
      </span>
    </>
  );

  return item.external ? (
    <a href={item.href} target="_blank" rel="noreferrer" className={className} onClick={onSelect}>
      {content}
    </a>
  ) : (
    <Link href={item.href} className={className} onClick={onSelect}>
      {content}
    </Link>
  );
}

export default function StickyHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState<MenuName>(null);
  const wrapRef = useRef<HTMLElement>(null);
  const onHome = pathname === "/";

  useEffect(() => setOpen(null), [pathname]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(null);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header
      ref={wrapRef}
      className="fixed right-0 top-0 z-50 flex h-14 items-center gap-2 px-2.5 chrome-glass-top sm:px-4"
      style={{ left: "var(--sidebar-w, 0px)" }}
    >
      <Link href="/" aria-label="Scroller home" className="group flex min-w-0 items-center gap-2.5">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--accent)] text-black shadow-[0_0_28px_color-mix(in_oklch,var(--accent)_28%,transparent)]">
          <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.5),transparent_48%)]" />
          <ScrollText className="relative h-[18px] w-[18px]" />
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="scroller-display block text-[11px] font-black uppercase leading-none tracking-[-0.03em]">Scroller</span>
          <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--foreground-muted)" }}>
            one feed · every source
          </span>
        </span>
      </Link>

      <span className="ml-1 hidden h-5 w-px sm:block" style={{ background: "var(--border)" }} />

      <div className="flex min-w-0 items-center gap-1.5">
        <span className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] md:flex" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          </span>
          {onHome ? "MediaAI live" : pathname.slice(1).replaceAll("-", " ") || "feed"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Link
          href="/browse"
          aria-label="Open all Scroller sources"
          className="flex h-9 items-center gap-2 rounded-xl border px-2.5 text-xs font-bold transition-colors hover:bg-[var(--surface-hover)]"
          style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}
        >
          <Layers3 className="h-4 w-4" />
          <span className="hidden lg:inline">All media</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((current) => (current === "assets" ? null : "assets"))}
          aria-expanded={open === "assets"}
          aria-label="Open asset navigation"
          className="flex h-9 items-center gap-2 rounded-xl border px-2.5 text-xs font-bold transition-colors hover:bg-[var(--surface-hover)]"
          style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}
        >
          <Cloud className="h-4 w-4" />
          <span className="hidden sm:inline">Assets</span>
          <ChevronDown className={`hidden h-3 w-3 transition-transform sm:block ${open === "assets" ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          onClick={() => setOpen((current) => (current === "publish" ? null : "publish"))}
          aria-expanded={open === "publish"}
          aria-label="Open publish destinations"
          className="flex h-9 items-center gap-2 rounded-xl border px-2.5 text-xs font-black transition-transform hover:-translate-y-0.5"
          style={{
            borderColor: "color-mix(in oklch, var(--publish-accent) 55%, transparent)",
            background: "color-mix(in oklch, var(--publish-accent) 16%, transparent)",
            color: "var(--publish-accent)",
          }}
        >
          <Rocket className="h-4 w-4" />
          <span className="hidden sm:inline">Publish</span>
          <ChevronDown className={`hidden h-3 w-3 transition-transform sm:block ${open === "publish" ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div
          className="absolute right-2.5 top-[calc(100%+8px)] max-h-[calc(100dvh-8rem)] w-[min(27rem,calc(100vw-1.25rem))] overflow-y-auto rounded-2xl border p-2 shadow-2xl sm:right-4"
          style={{
            borderColor: "var(--border-strong)",
            background: "color-mix(in oklch, var(--popover) 96%, transparent)",
            backdropFilter: "blur(24px)",
          }}
        >
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <div>
              <p className="scroller-display text-[11px] font-black uppercase tracking-[-0.02em]">
                {open === "assets" ? "Asset orbit" : "Publish first"}
              </p>
              <p className="mt-1 text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                {open === "assets" ? "Every generated surface and store" : "Priority destinations for the next release"}
              </p>
            </div>
            <button type="button" onClick={() => setOpen(null)} className="icon-btn" aria-label="Close navigation">
              <X className="h-4 w-4" />
            </button>
          </div>

          {open === "assets" ? (
            <div className="space-y-3">
              {ASSET_GROUPS.map((group) => (
                <section key={group.label}>
                  <p className="px-2 pb-1 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--foreground-muted)" }}>
                    {group.label}
                  </p>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {group.items.map((item) => <NavItemLink key={item.href} item={item} onSelect={() => setOpen(null)} />)}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="grid gap-1 sm:grid-cols-2">
              {PUBLISH_ITEMS.map((item) => <NavItemLink key={item.href} item={item} onSelect={() => setOpen(null)} />)}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
