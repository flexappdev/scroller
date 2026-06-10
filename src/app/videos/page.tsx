import { getVideos } from "@/lib/fetchers";
import SourceHero from "@/components/SourceHero";
import VideosClient from "./VideosClient";

export const revalidate = 600;

export const metadata = {
  title: "Videos",
  description: "Videos from @MatSiems and @mat-siems-production on YouTube.",
};

export default async function VideosPage() {
  const { videos } = await getVideos();

  return (
    <div className="space-y-8 p-8">
      <SourceHero
        source="videos"
        accent="#ef4444"
        label="Scroller · Videos"
        title="Videos"
        subtitle="Dual-channel YouTube feed — @MatSiems + @mat-siems-production, merged via handle resolver and deduplicated by video id."
        rightChip={`${videos.length} videos`}
      />

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
