"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, LayoutGrid, Video, Github, Sparkles, Laugh,
  Bookmark, Settings, Globe, Plane, ShoppingBag, Image as ImageIcon, Layers, Smartphone,
} from "lucide-react";
import { SCROLL_SOURCES, type ScrollSourceId } from "@/lib/scroll/sources";

interface AppNavProps { collapsed: boolean; onToggle?: () => void; }

const themeItems = [
  { href: "/", label: "Feed", icon: Smartphone },
  { href: "/funny", label: "Funny 100", icon: Laugh },
  { href: "/sites", label: "Sites", icon: Bookmark },
  { href: "/wiki", label: "Wiki", icon: Globe },
  { href: "/about", label: "About", icon: Home },
];

const SOURCE_ICONS: Record<ScrollSourceId, typeof Layers> = {
  all: Layers,
  mediai: Smartphone,
  videos: Video,
  github: Github,
  prompts: Sparkles,
  apps: LayoutGrid,
  sites: Bookmark,
  wiki: Globe,
  wikivoyage: Plane,
  amazon: ShoppingBag,
  images: ImageIcon,
  funny: Laugh,
};

const sourceItems = SCROLL_SOURCES
  .filter((s) => s.id !== "all")
  .map((s) => ({ href: s.href, label: s.label, icon: SOURCE_ICONS[s.id] ?? Layers }));

const adminItems = [
  { href: "/admin", label: "Admin", icon: Settings },
];

function NavLink({ href, label, icon: Icon, collapsed, active }: { href: string; label: string; icon: typeof Home; collapsed: boolean; active: boolean }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      style={{
        color: active ? "var(--accent)" : "var(--foreground-muted)",
        background: active ? "color-mix(in oklch, var(--accent) 14%, transparent)" : "transparent",
        borderLeft: `2px solid ${active ? "var(--accent)" : "transparent"}`,
      }}
      className={`flex items-center ${collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2"} text-sm hover:!text-[var(--foreground)] transition-colors`}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface-hover)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export default function AppNav({ collapsed }: AppNavProps) {
  const pathname = usePathname();
  const isActive = (href: string) => {
    const clean = href.split("?")[0];
    if (clean === "/") return pathname === "/";
    return pathname === clean || pathname.startsWith(clean + "/");
  };

  return (
    <aside
      className="fixed left-0 top-0 h-full flex flex-col transition-[width] duration-200 z-40"
      style={{
        width: collapsed ? 60 : 200,
        background: "color-mix(in oklch, var(--background) 92%, transparent)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* v3.1 — wikai-style logo tile (no expand/collapse chrome). */}
      <div className="flex items-center justify-center h-14" style={{ borderBottom: "1px solid var(--border)" }}>
        <Link
          href="/"
          aria-label="Scroller home"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg"
          style={{
            background: "var(--accent)",
            boxShadow: "0 6px 20px color-mix(in oklch, var(--accent) 40%, transparent)",
          }}
        >
          <Smartphone className="h-4 w-4 text-white" />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {themeItems.map(({ href, label, icon }) => (
          <NavLink key={href} href={href} label={label} icon={icon} collapsed={collapsed} active={isActive(href)} />
        ))}
        <div className="my-3" style={{ borderTop: "1px solid var(--border)" }} />
        {!collapsed && (
          <div className="px-3 pb-1 text-[10px] uppercase tracking-[0.14em] font-mono" style={{ color: "var(--foreground-muted)" }}>
            Sources
          </div>
        )}
        {sourceItems.map(({ href, label, icon }) => (
          <NavLink key={href} href={href} label={label} icon={icon} collapsed={collapsed} active={isActive(href)} />
        ))}
        <div className="my-3" style={{ borderTop: "1px solid var(--border)" }} />
        {!collapsed && (
          <div className="px-3 pb-1 text-[10px] uppercase tracking-[0.14em] font-mono" style={{ color: "var(--foreground-muted)" }}>
            Editor
          </div>
        )}
        {adminItems.map(({ href, label, icon }) => (
          <NavLink key={href} href={href} label={label} icon={icon} collapsed={collapsed} active={isActive(href)} />
        ))}
      </nav>
    </aside>
  );
}
