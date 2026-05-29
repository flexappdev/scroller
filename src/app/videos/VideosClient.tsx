"use client";

import type { Video } from "@/lib/fetchers";
import PageSearch from "@/components/PageSearch";

export default function VideosClient({ videos }: { videos: Video[] }) {
  return (
    <PageSearch<Video>
      items={videos}
      placeholder={`Search ${videos.length} videos…`}
      searchFields={(v) => `${v.title} ${v.id}`}
      renderGrid={(filtered) => (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((v) => (
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
      renderList={(filtered) => (
        <ul className="space-y-2">
          {filtered.map((v) => (
            <li key={v.id}>
              <a
                href={v.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-md border border-zinc-800/60 hover:border-emerald-700/50 bg-zinc-950/40 p-3 transition-colors group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.thumbnail} alt={v.title} className="h-12 w-20 rounded object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-zinc-100 group-hover:text-emerald-400 truncate">{v.title}</h3>
                  <p className="text-[11px] text-zinc-500">{new Date(v.published).toLocaleDateString()}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
