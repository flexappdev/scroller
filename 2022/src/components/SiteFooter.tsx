import Link from "next/link";
import { APP } from "@/lib/app-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="container flex flex-col items-start justify-between gap-3 py-8 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "var(--brand-warm)" }}
          />
          <span className="font-medium">{APP.name}</span>
          <span className="text-muted-foreground">— {APP.tagline}</span>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/about" className="hover:text-foreground">About</Link>
          <Link href="/contact" className="hover:text-foreground">Contact</Link>
          <a
            href="https://www.linkedin.com/in/matsiems/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            LinkedIn
          </a>
        </nav>
      </div>
      <div className="border-t border-border/60">
        <div className="container py-3 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {APP.name} · run by Mat Siems
        </div>
      </div>
    </footer>
  );
}
