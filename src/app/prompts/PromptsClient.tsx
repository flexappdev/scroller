"use client";

import { useState } from "react";
import type { Prompt } from "@/lib/fetchers";
import PageBrowser from "@/components/PageBrowser";
import ItemModal, { type ItemModalDetail } from "@/components/ItemModal";
import type { Card as ScrollerCard } from "@/components/ScrollerFeed";

export default function PromptsClient({ prompts }: { prompts: Prompt[] }) {
  const [modal, setModal] = useState<ItemModalDetail | null>(null);

  function openPrompt(p: Prompt) {
    setModal({
      id: `prompt:${p.act}`,
      title: p.act,
      subtitle: "AI Prompt",
      description: p.prompt,
      accent: "#f59e0b",
      internalHref: `/items/${encodeURIComponent(`prompt:${p.act}`)}`,
    });
  }

  return (
    <>
      <PageBrowser<Prompt>
        pageKey="prompts"
        items={prompts}
        placeholder={`Search ${prompts.length} prompts…`}
        searchFields={(p) => `${p.act} ${p.prompt}`}
        alphaOf={(p) => p.act}
        rankOf={(p, i) => i}
        toScrollerCard={(p): ScrollerCard => ({ kind: "prompt", act: p.act, prompt: p.prompt })}
        renderGrid={(filtered) => (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <button
                key={`${p.act}-${i}`}
                type="button"
                onClick={() => openPrompt(p)}
                className="text-left rounded-md border border-zinc-800/60 hover:border-emerald-700/50 bg-zinc-950/40 p-4 transition-colors group"
              >
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1">#{i + 1}</div>
                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400">{p.act}</h3>
                <p className="mt-1 text-xs text-zinc-400 line-clamp-3">{p.prompt}</p>
              </button>
            ))}
          </section>
        )}
        renderList={(filtered) => (
          <ul className="space-y-2">
            {filtered.map((p, i) => (
              <li key={`${p.act}-${i}`}>
                <button
                  type="button"
                  onClick={() => openPrompt(p)}
                  className="w-full text-left rounded-md border border-zinc-800/60 hover:border-emerald-700/50 bg-zinc-950/40 p-3 transition-colors group"
                >
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1">#{i + 1}</div>
                  <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400">{p.act}</h3>
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{p.prompt}</p>
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
