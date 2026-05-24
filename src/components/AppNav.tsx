"use client";
import Link from "next/link";
import { Home, Smartphone, LayoutGrid, Video, Github, Sparkles, ChevronLeft, ChevronRight, Bookmark, Settings } from "lucide-react";

interface AppNavProps { collapsed: boolean; onToggle: () => void; }

const themeItems = [
  { href: "/", label: "Scroller", icon: Smartphone },
  { href: "/sites", label: "Sites", icon: Bookmark },
  { href: "/about", label: "About", icon: Home },
];
const genericItems = [
  { href: "/apps", label: "Apps", icon: LayoutGrid },
  { href: "/videos", label: "Videos", icon: Video },
  { href: "/github", label: "GitHub", icon: Github },
  { href: "/prompts", label: "Prompts", icon: Sparkles },
];
const adminItems = [
  { href: "/admin", label: "Admin", icon: Settings },
];

export default function AppNav({ collapsed, onToggle }: AppNavProps) {
  return (
    <aside className="fixed left-0 top-0 h-full bg-zinc-950/95 border-r border-zinc-800 flex flex-col transition-[width] duration-200 z-40" style={{ width: collapsed ? 52 : 180 }}>
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        {!collapsed && <span className="text-sm font-semibold text-zinc-100 truncate">Scroller</span>}
        <button onClick={onToggle} className="text-zinc-400 hover:text-zinc-100 transition-colors ml-auto" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {themeItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors">
            <Icon className="h-4 w-4 shrink-0" />{!collapsed && <span className="text-sm truncate">{label}</span>}
          </Link>
        ))}
        <div className="my-2 border-t border-zinc-800" />
        {!collapsed && <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-zinc-600">Shared</div>}
        {genericItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors">
            <Icon className="h-4 w-4 shrink-0" />{!collapsed && <span className="text-sm truncate">{label}</span>}
          </Link>
        ))}
        <div className="my-2 border-t border-zinc-800" />
        {!collapsed && <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-zinc-600">Editor</div>}
        {adminItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800/50 transition-colors">
            <Icon className="h-4 w-4 shrink-0" />{!collapsed && <span className="text-sm truncate">{label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
