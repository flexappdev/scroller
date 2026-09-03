"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Compass, Home, Plus, UserRound } from "lucide-react";

const NAV = [
  { label: "Home", href: "/", icon: Home, primary: false },
  { label: "Explore", href: "/explore", icon: Compass, primary: false },
  { label: "Gen", href: "/create", icon: Plus, primary: true },
  { label: "Saved", href: "/saved", icon: Bookmark, primary: false },
  { label: "Me", href: "/me", icon: UserRound, primary: false },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/scroller/");
  if (href === "/explore") return pathname === "/explore" || pathname.startsWith("/browse");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function StickyFooter() {
  const pathname = usePathname();

  return (
    <footer
      className="fixed bottom-0 right-0 z-50 h-[4.5rem] chrome-glass-bottom"
      style={{ left: "var(--sidebar-w, 200px)" }}
      aria-label="Primary navigation"
    >
      <nav className="mx-auto grid h-full w-full max-w-2xl grid-cols-5 items-center px-1 sm:px-3">
        {NAV.map(({ label, href, icon: Icon, primary }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className="group flex h-full min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors sm:text-xs"
              style={{ color: active || primary ? "var(--accent)" : "var(--foreground-muted)" }}
            >
              {primary ? (
                <span
                  className="flex h-11 w-11 -translate-y-1 items-center justify-center rounded-2xl shadow-[0_10px_30px_color-mix(in_oklch,var(--accent)_28%,transparent)] transition-transform group-hover:-translate-y-1.5"
                  style={{ background: "var(--accent)", color: "#050505" }}
                >
                  <Icon className="h-6 w-6" strokeWidth={2.6} />
                </span>
              ) : (
                <Icon className="h-5 w-5" strokeWidth={active ? 2.6 : 2} />
              )}
              <span className={primary ? "-mt-1" : ""}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
