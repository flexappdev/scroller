"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, Compass, Home, Plus, UserRound, type LucideIcon } from "lucide-react";

type Item = {
  label: string;
  href: string;
  icon: LucideIcon;
  primary?: boolean;
  active: (pathname: string) => boolean;
};

const ITEMS: Item[] = [
  { label: "Home", href: "/", icon: Home, active: (p) => p === "/" || p.startsWith("/scroller/") },
  { label: "Explore", href: "/explore", icon: Compass, active: (p) => p === "/explore" || p.startsWith("/browse") },
  { label: "Gen", href: "/create", icon: Plus, primary: true, active: (p) => p === "/create" },
  { label: "Saved", href: "/saved", icon: Bookmark, active: (p) => p === "/saved" },
  { label: "Me", href: "/me", icon: UserRound, active: (p) => p === "/me" },
];

export default function StickyFooter() {
  const pathname = usePathname();
  const router = useRouter();

  function refreshHome() {
    if (pathname !== "/") {
      router.push("/");
      return;
    }
    window.dispatchEvent(new CustomEvent("scroller:random"));
    router.refresh();
  }

  return (
    <footer
      className="fixed bottom-0 right-0 z-50 h-[4.5rem] chrome-glass-bottom"
      style={{ left: "var(--sidebar-w, 0px)" }}
      aria-label="Primary navigation"
    >
      <nav className="mx-auto grid h-full w-full max-w-2xl grid-cols-5 items-center px-1 sm:px-3">
        {ITEMS.map(({ label, href, icon: Icon, primary, active }) => {
          const isActive = active(pathname);
          const classes =
            "group flex h-full min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors sm:text-xs";
          const content = (
            <>
              {primary ? (
                <span
                  className="flex h-11 w-11 -translate-y-1 items-center justify-center rounded-2xl shadow-[0_10px_30px_color-mix(in_oklch,var(--accent)_28%,transparent)] transition-transform group-hover:-translate-y-1.5"
                  style={{ background: "var(--accent)", color: "#050505" }}
                >
                  <Icon className="h-6 w-6" strokeWidth={2.6} />
                </span>
              ) : (
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.6 : 2} />
              )}
              <span className={primary ? "-mt-1" : ""}>{label}</span>
            </>
          );

          const style = { color: isActive || primary ? "var(--accent)" : "var(--foreground-muted)" };

          if (href === "/") {
            return (
              <button
                key={href}
                type="button"
                onClick={refreshHome}
                aria-label={pathname === "/" ? "Refresh Home with a random Scroller" : "Home"}
                aria-current={isActive ? "page" : undefined}
                className={classes}
                style={style}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={classes}
              style={style}
            >
              {content}
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
