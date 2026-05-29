import { Loader2 } from "lucide-react";

export default function HomeLoading() {
  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex items-center gap-3 text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
        <span className="text-sm">Loading scroll sources…</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 overflow-hidden"
            style={{ borderLeftWidth: 3, borderLeftColor: "#27272a" }}
          >
            <div className="aspect-video bg-zinc-900 animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-2 w-12 rounded bg-zinc-900 animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-zinc-900 animate-pulse" />
              <div className="h-2 w-1/2 rounded bg-zinc-900 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
