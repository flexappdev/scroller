import { getVideos } from "@/lib/fetchers";

export const revalidate = 600;

export default async function VideosPage() {
  const { videos } = await getVideos();

  return (
    <div className="space-y-8 p-8">
      <header className="rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--app-accent)" }} />
          FAD · Videos
        </div>
        <h1 className="mt-3 text-4xl font-bold text-zinc-100">Videos</h1>
        <p className="mt-2 text-zinc-400">
          {videos.length} videos from{" "}
          <a className="underline" href="https://www.youtube.com/@mat-siems-production" target="_blank" rel="noreferrer">
            @mat-siems-production
          </a>
        </p>
      </header>

      {videos.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
          No videos resolved from RSS. Check{" "}
          <a className="underline" href="https://www.youtube.com/@mat-siems-production" target="_blank" rel="noreferrer">
            the channel
          </a>{" "}
          directly.
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((v) => (
            <a
              key={v.id}
              href={v.url}
              target="_blank"
              rel="noreferrer"
              className="group rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden transition-colors hover:border-zinc-700"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.thumbnail} alt={v.title} className="aspect-video w-full object-cover" />
              <div className="p-3">
                <h3 className="line-clamp-2 text-sm font-medium text-zinc-100 group-hover:text-white">{v.title}</h3>
                <p className="mt-1 text-[11px] text-zinc-500">{new Date(v.published).toLocaleDateString()}</p>
              </div>
            </a>
          ))}
        </section>
      )}
    </div>
  );
}
