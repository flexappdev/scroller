import { getImageItems } from "@/lib/scroll/images";
import SourceHero from "@/components/SourceHero";
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
      <SourceHero
        source="images"
        accent="#22d3ee"
        label="Scroller · Images"
        title="Images"
        subtitle="S3 gallery from com27 — signed URLs, 15-field metadata per item, paginated cursor. Search across filenames and folders."
        rightChip={`${items.length} loaded${nextCursor ? " · more on scroll" : ""}`}
      />
      <ImagesClient initialItems={items} initialCursor={nextCursor} />
    </main>
  );
}
