"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/sites", label: "Sites" },
  { href: "/admin/wiki", label: "Wiki" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="border-b border-zinc-800 px-6 pt-4">
      <div className="flex items-center gap-1">
        {TABS.map((t) => {
          const active =
            t.href === "/admin"
              ? pathname === "/admin"
              : pathname === t.href || pathname?.startsWith(`${t.href}/`);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-3 py-2 text-sm font-medium transition-colors -mb-px border-b-2 ${
                active
                  ? "text-zinc-100 border-emerald-500"
                  : "text-zinc-400 border-transparent hover:text-zinc-100"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
        <form action="/api/auth/logout" method="POST" className="ml-auto -mb-px">
          <button
            type="submit"
            className="px-3 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
            aria-label="Sign out"
          >
            Sign out ↗
          </button>
        </form>
      </div>
    </div>
  );
}
