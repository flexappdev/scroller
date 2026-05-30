import Link from "next/link";
import { Dices, ArrowLeft } from "lucide-react";
import { SCROLL_SOURCES } from "@/lib/scroll/sources";

export const metadata = {
  title: "Not found",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  const sources = SCROLL_SOURCES.filter((s) => s.id !== "all");

  return (
    <div className="px-6 py-16 max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500 font-mono">
          <Dices className="h-3.5 w-3.5 text-emerald-400" />
          404 · Not found
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Nothing to scroll here.</h1>
        <p className="text-sm text-zinc-400 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist. Try one of the scroll sources
          below, or head back to the home feed.
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-700/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300 hover:border-emerald-500 hover:text-emerald-200 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to scroller
      </Link>

      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-mono">Sources</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {sources.map((s) => (
            <li key={s.id}>
              <Link
                href={s.href}
                className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-300 hover:border-emerald-700/50 hover:text-emerald-400 transition-colors"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: s.accent }} />
                <span className="font-mono text-xs">{s.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
