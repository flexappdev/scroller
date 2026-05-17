"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function PromptCard({ index, act, prompt }: { index: number; act: string; prompt: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <button
      onClick={copy}
      className="group rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-left transition-colors hover:border-zinc-700"
      style={{ borderLeftWidth: 3, borderLeftColor: "var(--app-accent)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] text-zinc-500">#{index}</span>
          <h3 className="text-sm font-semibold text-zinc-100">{act}</h3>
        </div>
        {copied ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4 text-zinc-500 group-hover:text-zinc-200" />
        )}
      </div>
      <p className="mt-2 line-clamp-4 text-xs text-zinc-400">{prompt}</p>
    </button>
  );
}
