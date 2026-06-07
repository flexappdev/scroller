import { getImageItems } from "@/lib/scroll/images";
import ImagesClient from "./ImagesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Images · Scroller",
  description: "S3 image gallery with metadata, search, and pagination.",
};

export default async function ImagesPage() {
  const { items, nextCursor } = await getImageItems({ limit: 200 });
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 space-y-6">
      <header>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500 font-mono mb-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#22d3ee" }} />
          Scroller · Images
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Images</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          S3 gallery. {items.length} loaded {nextCursor && "(more on demand)"}. Each card carries key, size, and last-modified
          metadata; search across filenames and folders.
        </p>
      </header>
      <ImagesClient initialItems={items} initialCursor={nextCursor} />
    </main>
  );
}
