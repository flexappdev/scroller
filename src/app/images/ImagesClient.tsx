"use client";

import { useState, useCallback } from "react";
import PageBrowser from "@/components/PageBrowser";
import ItemModal, { type ItemModalDetail } from "@/components/ItemModal";
import type { Card as ScrollerCard } from "@/components/ScrollerFeed";
import type { ImageItem } from "@/lib/scroll/images";

function humanBytes(n: number): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function folderOf(key: string): string {
  const i = key.lastIndexOf("/");
  return i >= 0 ? key.slice(0, i) : "(root)";
}

export default function ImagesClient({
  initialItems,
  initialCursor,
}: {
  initialItems: ImageItem[];
  initialCursor: string | null;
}) {
  const [items, setItems] = useState<ImageItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<ItemModalDetail | null>(null);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/scroll/images?cursor=${encodeURIComponent(cursor)}&limit=200`);
      if (!res.ok) return;
      const data = (await res.json()) as { items: ImageItem[]; nextCursor: string | null };
      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);

  function openItem(img: ImageItem) {
    setModal({
      id: `image:${img.id}`,
      title: img.title,
      subtitle: `${folderOf(img.key)} · ${humanBytes(img.size)}${img.lastModified ? ` · ${img.lastModified.slice(0, 10)}` : ""}`,
      description: img.key,
      url: img.url,
      urlLabel: "Open original",
      accent: "#22d3ee",
    });
  }

  const folders = Array.from(new Set(items.map((i) => folderOf(i.key)))).sort();

  return (
    <>
      <PageBrowser<ImageItem>
        pageKey="images"
        items={items}
        placeholder={`Search ${items.length} images by name, key, or folder…`}
        searchFields={(i) => `${i.title} ${i.key} ${folderOf(i.key)}`}
        alphaOf={(i) => i.title}
        rankOf={(i, idx) => -(new Date(i.lastModified ?? 0).getTime() || -idx)}
        kindOf={(i) => folderOf(i.key)}
        kindOptions={folders.map((f) => ({ value: f, label: f }))}
        onLoadMore={cursor ? loadMore : undefined}
        hasMore={!!cursor}
        loading={loading}
        toScrollerCard={(i): ScrollerCard => ({
          kind: "image",
          id: i.id,
          key: i.key,
          url: i.url,
          title: i.title,
          size: i.size,
        })}
        renderGrid={(filtered) => (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => openItem(img)}
                className="text-left rounded-lg border border-zinc-800/60 hover:border-cyan-700/50 bg-zinc-950/40 overflow-hidden transition-colors group"
              >
                <div className="aspect-square bg-zinc-900 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-2">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono truncate">
                    {folderOf(img.key)}
                  </div>
                  <h3 className="text-xs font-medium text-zinc-100 group-hover:text-cyan-300 truncate">{img.title}</h3>
                  <div className="mt-1 flex gap-2 text-[10px] font-mono text-zinc-600">
                    <span>{humanBytes(img.size)}</span>
                    {img.lastModified && <span>{img.lastModified.slice(0, 10)}</span>}
                  </div>
                </div>
              </button>
            ))}
          </section>
        )}
        renderList={(filtered) => (
          <ul className="space-y-2">
            {filtered.map((img) => (
              <li key={img.id}>
                <button
                  type="button"
                  onClick={() => openItem(img)}
                  className="w-full text-left flex items-center gap-3 rounded-md border border-zinc-800/60 hover:border-cyan-700/50 bg-zinc-950/40 px-3 py-2 transition-colors group"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.title} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-zinc-100 group-hover:text-cyan-300 truncate">{img.title}</h3>
                    <p className="text-[10px] font-mono text-zinc-600 truncate">{img.key}</p>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 shrink-0 text-right">
                    <div>{humanBytes(img.size)}</div>
                    {img.lastModified && <div className="text-zinc-700">{img.lastModified.slice(0, 10)}</div>}
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
