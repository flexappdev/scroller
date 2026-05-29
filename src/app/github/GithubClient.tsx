"use client";

import { useState } from "react";
import type { Star } from "@/lib/fetchers";
import PageBrowser from "@/components/PageBrowser";
import ItemModal, { type ItemModalDetail } from "@/components/ItemModal";
import type { Card as ScrollerCard } from "@/components/ScrollerFeed";

export default function GithubClient({ stars }: { stars: Star[] }) {
  const [modal, setModal] = useState<ItemModalDetail | null>(null);

  function openStar(s: Star) {
    setModal({
      id: `star:${encodeURIComponent(s.full_name)}`,
      title: s.full_name,
      subtitle: `GitHub · ${s.language ?? "Repo"} · ★ ${s.stargazers_count.toLocaleString()}`,
      description: s.description,
      url: s.html_url,
      urlLabel: "Open on GitHub",
      accent: "#a78bfa",
      internalHref: `/items/${encodeURIComponent(`star:${encodeURIComponent(s.full_name)}`)}`,
    });
  }

  return (
    <>
      <PageBrowser<Star>
        pageKey="github"
        items={stars}
        placeholder={`Search ${stars.length} repos…`}
        searchFields={(s) => `${s.full_name} ${s.description ?? ""} ${s.language ?? ""} ${s.topics.join(" ")}`}
        alphaOf={(s) => s.full_name}
        rankOf={(s) => -s.stargazers_count}
        toScrollerCard={(s): ScrollerCard => ({ kind: "star", full_name: s.full_name, description: s.description, html_url: s.html_url, stars: s.stargazers_count, language: s.language })}
        renderGrid={(filtered) => (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <button
                key={s.full_name}
                type="button"
                onClick={() => openStar(s)}
                className="text-left rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700"
                style={{ borderLeftWidth: 3, borderLeftColor: "var(--app-accent)" }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="truncate text-sm font-semibold text-zinc-100">{s.full_name}</h3>
                  <span className="shrink-0 text-[11px] text-zinc-500">★ {s.stargazers_count.toLocaleString()}</span>
                </div>
                {s.description && <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{s.description}</p>}
                {s.topics.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.topics.slice(0, 5).map((t) => (
                      <span key={t} className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] text-zinc-400">{t}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </section>
        )}
        renderList={(filtered) => (
          <ul className="space-y-2">
            {filtered.map((s) => (
              <li key={s.full_name}>
                <button
                  type="button"
                  onClick={() => openStar(s)}
                  className="w-full text-left flex items-baseline gap-3 rounded-md border border-zinc-800/60 hover:border-emerald-700/50 bg-zinc-950/40 px-4 py-2.5 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-zinc-100 group-hover:text-emerald-400 truncate">{s.full_name}</h3>
                    {s.description && <p className="text-xs text-zinc-500 truncate">{s.description}</p>}
                  </div>
                  <span className="text-[11px] text-zinc-500 shrink-0 font-mono">★ {s.stargazers_count.toLocaleString()}</span>
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
