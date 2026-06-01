import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchFullArticleByTitle } from "@/lib/wiki/fetch";
import {
  getWikiFullFromMongo,
  getWikiIndexByPageid,
  upsertWikiFullToMongo,
  upsertWikiIndex,
} from "@/lib/wiki/storage";
import type { WikiFullDoc } from "@/lib/wiki/types";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadArticle(pageid: number): Promise<{
  doc: WikiFullDoc | null;
  index: Awaited<ReturnType<typeof getWikiIndexByPageid>>;
  source: "cache" | "live" | "none";
}> {
  const index = await getWikiIndexByPageid(pageid);
  const cached = await getWikiFullFromMongo(pageid);
  if (cached) return { doc: cached, index, source: "cache" };
  if (index) {
    const live = await fetchFullArticleByTitle(index.title, {
      lang: index.lang,
      category: index.category,
    });
    if (live) {
      // Backfill cache on first read so subsequent hits are fast.
      const mongoRef = await upsertWikiFullToMongo(live);
      await upsertWikiIndex(live, mongoRef, mongoRef ? "ok" : "partial");
      return { doc: live, index, source: "live" };
    }
  }
  return { doc: null, index, source: "none" };
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const pageid = Number(id);
  if (!Number.isFinite(pageid)) return { title: "Wiki · Scroller" };
  const index = await getWikiIndexByPageid(pageid);
  if (!index) return { title: "Wiki article · Scroller" };
  return {
    title: `${index.title} · Scroller Wiki`,
    description: index.extract ?? index.description ?? `Wikipedia article: ${index.title}`,
    openGraph: {
      title: index.title,
      description: index.extract ?? index.description ?? undefined,
      images: index.lead_image_url ? [{ url: index.lead_image_url }] : undefined,
    },
  };
}

export default async function WikiArticlePage({ params }: PageProps) {
  const { id } = await params;
  const pageid = Number(id);
  if (!Number.isFinite(pageid)) notFound();

  const { doc, index, source } = await loadArticle(pageid);
  if (!doc) notFound();

  const sections = doc.sections.filter((s) => s.toclevel <= 3);
  const images = doc.media.filter((m) => m.type === "image" && m.thumbnail).slice(0, 24);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-12">
      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/wiki" className="hover:text-emerald-400">
          ← Wiki
        </Link>
      </nav>

      <header className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-zinc-700 text-[10px] uppercase tracking-wider text-zinc-400">
            {doc.category}
          </Badge>
          <span className="text-[11px] text-zinc-500">{doc.read_mins} min read</span>
          <span className="text-[11px] text-zinc-600">· {doc.word_count.toLocaleString()} words</span>
          <span className="text-[11px] text-zinc-600">
            · cached {source === "live" ? "just now" : new Date(doc.fetched_at).toLocaleDateString()}
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{doc.title}</h1>
        {doc.description ? (
          <p className="mt-1 text-sm uppercase tracking-wide text-zinc-500">{doc.description}</p>
        ) : null}
        {doc.extract ? <p className="mt-4 text-base text-zinc-300">{doc.extract}</p> : null}
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <a
            href={doc.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline"
          >
            View on Wikipedia ↗
          </a>
          <a
            href={`/api/wiki/article/${doc.pageid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300"
          >
            Raw JSON
          </a>
        </div>
      </header>

      {doc.lead_image_url ? (
        <figure className="mb-8 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={doc.lead_image_url} alt={doc.title} className="w-full" />
        </figure>
      ) : null}

      {doc.infobox && Object.keys(doc.infobox).length > 0 ? (
        <section className="mb-8 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-400">Infobox</h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {Object.entries(doc.infobox)
              .slice(0, 20)
              .map(([k, v]) => (
                <div key={k} className="flex gap-2 border-b border-zinc-900 pb-2 last:border-0">
                  <dt className="min-w-[120px] text-zinc-500">{k}</dt>
                  <dd className="text-zinc-200">{v}</dd>
                </div>
              ))}
          </dl>
        </section>
      ) : null}

      {sections.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-400">
            Sections ({sections.length})
          </h2>
          <ol className="space-y-1 text-sm">
            {sections.map((s) => (
              <li
                key={s.index}
                className="text-zinc-300"
                style={{ paddingLeft: `${(s.toclevel - 1) * 16}px` }}
              >
                <a
                  href={`${doc.source_url}#${s.anchor}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400"
                >
                  {s.line}
                </a>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {images.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-400">
            Media ({doc.media.length})
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((m) => (
              <a
                key={m.title}
                href={m.original ?? m.thumbnail}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 hover:border-emerald-700/60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.thumbnail!}
                  alt={m.caption ?? m.title}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
                {m.caption ? (
                  <span className="block px-2 py-1 text-[11px] text-zinc-500 line-clamp-1">
                    {m.caption}
                  </span>
                ) : null}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {doc.html ? (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-400">Full article</h2>
          <div
            className="wiki-html prose prose-invert max-w-none prose-headings:font-semibold prose-a:text-emerald-400 prose-img:rounded-md"
            dangerouslySetInnerHTML={{ __html: doc.html }}
          />
        </section>
      ) : null}

      {index ? (
        <p className="mt-12 text-xs text-zinc-600">
          Master index row · slug <code className="text-zinc-500">{index.slug}</code> · status {index.sync_status} ·
          last sync {new Date(index.updated_at).toLocaleString()}
        </p>
      ) : null}
    </main>
  );
}
