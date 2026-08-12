/**
 * PageBrowserSkeleton — themed loading state for the source pages
 * (/wiki, /images, /prompts, /videos, /sites, /apps, /github, /amazon).
 * 12-tile grid using zinc classes that get flipped by the [data-theme]
 * overrides in globals.css.
 */
export default function PageBrowserSkeleton({ tiles = 12 }: { tiles?: number }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6" role="status" aria-label="Loading feed">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-6 w-32 animate-pulse rounded bg-zinc-800/60" />
        <div className="h-6 w-16 animate-pulse rounded bg-zinc-800/40" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: tiles }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="aspect-video w-full bg-zinc-800/60" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-3/4 rounded bg-zinc-800/70" />
              <div className="h-2.5 w-1/2 rounded bg-zinc-800/50" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function DiagramsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8" role="status" aria-label="Loading diagrams">
      <div className="animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/50 p-8">
        <div className="mb-3 h-3 w-32 rounded bg-zinc-800/60" />
        <div className="mb-2 h-7 w-40 rounded bg-zinc-800/70" />
        <div className="h-3 w-3/4 rounded bg-zinc-800/50" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse space-y-3"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="h-4 w-48 rounded bg-zinc-800/60" />
          <div className="h-64 rounded-lg border border-zinc-800 bg-zinc-900/40" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
