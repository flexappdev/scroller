import { getVideos } from "@/lib/fetchers";
import VideosClient from "./VideosClient";

export const revalidate = 600;

export const metadata = {
  title: "Videos",
  description: "Videos from @mat-siems-production on YouTube.",
};

export default async function VideosPage() {
  const { videos } = await getVideos();

  return (
    <div className="space-y-8 p-8">
      <header className="rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--app-accent)" }} />
          Scroller · Videos
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
        <VideosClient videos={videos} />
      )}
    </div>
  );
}
