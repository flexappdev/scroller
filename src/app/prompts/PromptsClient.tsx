"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { Prompt } from "@/lib/fetchers";
import PageBrowser from "@/components/PageBrowser";
import ItemModal, { type ItemModalDetail } from "@/components/ItemModal";
import type { Card as ScrollerCard } from "@/components/ScrollerFeed";

const S3_PUBLIC_BASE = "https://com27.s3.eu-west-2.amazonaws.com";
const imageForPrompt = (act: string) =>
  `${S3_PUBLIC_BASE}/scroller/prompts/${encodeURIComponent(
    act.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
  )}.png`;

function copy(text: string, mark: () => void) {
  navigator.clipboard.writeText(text).then(() => mark()).catch(() => {});
}

export default function PromptsClient({ prompts }: { prompts: Prompt[] }) {
  const [modal, setModal] = useState<ItemModalDetail | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function flashCopied(idx: number) {
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1500);
  }

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
              <div
                key={`${p.act}-${i}`}
                className="relative rounded-lg border border-zinc-800/60 hover:border-amber-700/50 bg-zinc-950/40 overflow-hidden transition-colors group"
                style={{ borderLeftWidth: 3, borderLeftColor: "#f59e0b" }}
              >
                <button
                  type="button"
                  onClick={() => openPrompt(p)}
                  className="text-left w-full"
                >
                  <div className="aspect-[16/9] bg-zinc-900 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageForPrompt(p.act)}
                      alt={p.act}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  <div className="p-4">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1">#{i + 1}</div>
                    <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-amber-300">{p.act}</h3>
                    <p className="mt-1 text-xs text-zinc-400 line-clamp-3">{p.prompt}</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); copy(p.prompt, () => flashCopied(i)); }}
                  className="absolute top-2 right-2 rounded-md border border-zinc-700 bg-zinc-900/90 px-2 py-1 text-[10px] font-mono text-zinc-300 hover:border-amber-500 hover:text-amber-300 flex items-center gap-1"
                  title="Copy prompt"
                >
                  {copiedIdx === i ? (<><Check className="h-3 w-3 text-emerald-400" /> Copied</>) : (<><Copy className="h-3 w-3" /> Copy</>)}
                </button>
              </div>
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
