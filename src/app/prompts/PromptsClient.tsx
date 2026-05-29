"use client";

import type { Prompt } from "@/lib/fetchers";
import PageSearch from "@/components/PageSearch";
import PromptCard from "./PromptCard";

export default function PromptsClient({ prompts }: { prompts: Prompt[] }) {
  return (
    <PageSearch<Prompt>
      items={prompts}
      placeholder={`Search ${prompts.length} prompts…`}
      searchFields={(p) => `${p.act} ${p.prompt}`}
      renderGrid={(filtered) => (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <PromptCard key={`${p.act}-${i}`} index={i + 1} act={p.act} prompt={p.prompt} />
          ))}
        </section>
      )}
      renderList={(filtered) => (
        <ul className="space-y-2">
          {filtered.map((p, i) => (
            <li key={`${p.act}-${i}`} className="rounded-md border border-zinc-800/60 bg-zinc-950/40 p-3">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1">#{i + 1}</div>
              <h3 className="text-sm font-semibold text-zinc-100">{p.act}</h3>
              <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{p.prompt}</p>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
