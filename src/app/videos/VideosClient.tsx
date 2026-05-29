"use client";

import { useState } from "react";
import type { Video } from "@/lib/fetchers";
import PageBrowser from "@/components/PageBrowser";
import ItemModal, { type ItemModalDetail } from "@/components/ItemModal";
import type { Card as ScrollerCard } from "@/components/ScrollerFeed";

export default function VideosClient({ videos }: { videos: Video[] }) {
  const [modal, setModal] = useState<ItemModalDetail | null>(null);

  function openVideo(v: Video) {
    setModal({
      id: `video:${v.id}`,
      title: v.title,
      subtitle: `Video · ${new Date(v.published).toLocaleDateString()}`,
      image: v.thumbnail,
      url: v.url,
      urlLabel: "Watch on YouTube",
      accent: "#ef4444",
      internalHref: `/items/${encodeURIComponent(`video:${v.id}`)}`,
    });
  }

  return (
    <>
      <PageBrowser<Video>
        pageKey="videos"
        items={videos}
        placeholder={`Search ${videos.length} videos…`}
        searchFields={(v) => `${v.title} ${v.id}`}
        alphaOf={(v) => v.title}
        rankOf={(v, i) => -new Date(v.published).getTime() || i}
        toScrollerCard={(v): ScrollerCard => ({ kind: "video", id: v.id, title: v.title, url: v.url, thumbnail: v.thumbnail, published: v.published })}
        renderGrid={(filtered) => (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => openVideo(v)}
                className="text-left group rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden transition-colors hover:border-zinc-700"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.thumbnail} alt={v.title} className="aspect-video w-full object-cover" />
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-medium text-zinc-100 group-hover:text-white">{v.title}</h3>
                  <p className="mt-1 text-[11px] text-zinc-500">{new Date(v.published).toLocaleDateString()}</p>
                </div>
              </button>
            ))}
          </section>
        )}
        renderList={(filtered) => (
          <ul className="space-y-2">
            {filtered.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => openVideo(v)}
                  className="w-full text-left flex items-center gap-3 rounded-md border border-zinc-800/60 hover:border-emerald-700/50 bg-zinc-950/40 p-3 transition-colors group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.thumbnail} alt={v.title} className="h-12 w-20 rounded object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-zinc-100 group-hover:text-emerald-400 truncate">{v.title}</h3>
                    <p className="text-[11px] text-zinc-500">{new Date(v.published).toLocaleDateString()}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      />
      <ItemModal item={modal} onClose={() => setModal(null)} />
    </>
  );
}
