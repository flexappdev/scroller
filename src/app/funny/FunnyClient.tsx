"use client";

import { useMemo, useState } from "react";
import { Check, Clapperboard, Copy, Image as ImageIcon, Play, Search, Share2, Workflow } from "lucide-react";
import type { FunnyThing } from "@/lib/funny";

type ViewMode = "copy" | "diagram" | "image" | "video";

const modes: Array<{ id: ViewMode; label: string; icon: typeof Copy }> = [
  { id: "copy", label: "Copy", icon: Copy },
  { id: "diagram", label: "Diagram", icon: Workflow },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "video", label: "Video", icon: Clapperboard },
];

const categoryColours: Record<string, string> = {
  Animals: "#10b981",
  Technology: "#60a5fa",
  "Everyday chaos": "#fb7185",
  "Human behaviour": "#f59e0b",
  "Home life": "#a78bfa",
  "Social survival": "#22d3ee",
  Children: "#f472b6",
  Food: "#f97316",
  Work: "#84cc16",
  "Public life": "#eab308",
};

function CopyCard({ item }: { item: FunnyThing }) {
  const [copied, setCopied] = useState(false);

  async function copyText() {
    await navigator.clipboard.writeText(`${item.rank}. ${item.title}\n${item.copy}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <article className="group flex min-h-64 flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <CardTop item={item} />
      <h2 className="mt-7 text-2xl font-semibold tracking-tight text-zinc-100">{item.title}</h2>
      <p className="mt-4 flex-1 text-base leading-7 text-zinc-400">{item.copy}</p>
      <button onClick={copyText} className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy joke"}
      </button>
    </article>
  );
}

function DiagramCard({ item }: { item: FunnyThing }) {
  const accent = categoryColours[item.category] ?? "#10b981";
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <CardTop item={item} />
      <h2 className="mt-5 text-xl font-semibold text-zinc-100">{item.title}</h2>
      <div className="mt-5 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-3">
        <svg viewBox="0 0 640 224" role="img" aria-label={`How ${item.title} works`} className="h-auto w-full">
          <defs>
            <marker id={`arrow-${item.rank}`} viewBox="0 0 8 8" refX="8" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M0 0L8 4L0 8Z" fill="#71717a" />
            </marker>
          </defs>
          <text x="24" y="28" fill="#71717a" fontSize="12" letterSpacing="2">ANATOMY OF THE JOKE</text>
          <line x1="152" y1="116" x2="240" y2="116" stroke="#52525b" markerEnd={`url(#arrow-${item.rank})`} />
          <line x1="400" y1="116" x2="488" y2="116" stroke="#52525b" markerEnd={`url(#arrow-${item.rank})`} />
          <rect x="24" y="68" width="128" height="96" rx="8" fill="#18181b" stroke="#3f3f46" />
          <rect x="256" y="68" width="144" height="96" rx="8" fill="#18181b" stroke="#3f3f46" />
          <rect x="488" y="68" width="128" height="96" rx="8" fill={accent} fillOpacity="0.16" stroke={accent} />
          <text x="40" y="96" fill="#a1a1aa" fontSize="11">SETUP</text>
          <text x="272" y="96" fill="#a1a1aa" fontSize="11">THE TURN</text>
          <text x="504" y="96" fill={accent} fontSize="11">PUNCHLINE</text>
          <text x="40" y="124" fill="#f4f4f5" fontSize="14">{item.setup.slice(0, 17)}</text>
          <text x="272" y="124" fill="#f4f4f5" fontSize="14">{item.turn.slice(0, 19)}</text>
          <text x="504" y="124" fill="#f4f4f5" fontSize="14">{item.punchline.slice(0, 15)}</text>
          <text x="320" y="204" textAnchor="middle" fill="#71717a" fontSize="12">EXPECTATION → INTERRUPTION → RELEASE</text>
        </svg>
      </div>
    </article>
  );
}

function ImageCard({ item }: { item: FunnyThing }) {
  const accent = categoryColours[item.category] ?? "#10b981";
  return (
    <article className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-zinc-950" style={{ backgroundImage: `radial-gradient(circle at 50% 45%, ${accent}32, transparent 54%)` }}>
        <div className="absolute inset-x-8 bottom-8 h-px bg-zinc-700" />
        <div className="absolute right-5 top-5 font-mono text-xs text-zinc-500">#{String(item.rank).padStart(3, "0")}</div>
        <span className="relative text-8xl drop-shadow-2xl transition duration-300 group-hover:-rotate-6 group-hover:scale-110" role="img" aria-label="">{item.emoji}</span>
        <span className="absolute bottom-3 left-4 rounded-full border border-zinc-700 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-zinc-300 backdrop-blur">Editorial visual</span>
      </div>
      <div className="p-5">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: accent }}>{item.category}</p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-100">{item.title}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{item.copy}</p>
      </div>
    </article>
  );
}

function VideoCard({ item }: { item: FunnyThing }) {
  const [playing, setPlaying] = useState(false);
  const accent = categoryColours[item.category] ?? "#10b981";

  function play() {
    setPlaying(true);
    window.setTimeout(() => setPlaying(false), 4200);
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
      <div className="relative aspect-[9/12] overflow-hidden bg-zinc-950 p-5" style={{ boxShadow: playing ? `inset 0 0 0 2px ${accent}` : undefined }}>
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
          <span>24 sec short</span><span>{String(item.rank).padStart(2, "0")} / 100</span>
        </div>
        <div className={`mt-8 text-center transition-all duration-700 ${playing ? "scale-110" : ""}`}>
          <span className="text-7xl" role="img" aria-label="">{item.emoji}</span>
          <h2 className="mx-auto mt-6 max-w-xs text-2xl font-bold leading-tight text-zinc-100">{item.title}</h2>
        </div>
        <div className="absolute inset-x-5 bottom-20 space-y-2">
          {[item.setup, item.turn, item.punchline].map((beat, index) => (
            <div key={beat} className={`rounded-lg border px-3 py-2 text-xs transition-all duration-500 ${playing ? "translate-x-0 opacity-100" : index === 0 ? "opacity-100" : "translate-x-3 opacity-45"}`} style={{ borderColor: index === 2 ? accent : "#3f3f46", transitionDelay: `${index * 650}ms` }}>
              <span className="mr-2 font-mono text-zinc-600">{index * 8}s</span>{beat}
            </div>
          ))}
        </div>
        <button onClick={play} disabled={playing} aria-label={`Play storyboard for ${item.title}`} className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-wait" style={{ backgroundColor: accent }}>
          <Play className="h-4 w-4 fill-current" />{playing ? "Playing…" : "Play concept"}
        </button>
      </div>
      <p className="p-4 text-sm leading-6 text-zinc-400">{item.copy}</p>
    </article>
  );
}

function CardTop({ item }: { item: FunnyThing }) {
  const accent = categoryColours[item.category] ?? "#10b981";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-sm text-zinc-500">#{String(item.rank).padStart(3, "0")}</span>
      <span className="truncate text-[10px] font-medium uppercase tracking-[0.16em]" style={{ color: accent }}>{item.category}</span>
    </div>
  );
}

export default function FunnyClient({ items, categories }: { items: FunnyThing[]; categories: string[] }) {
  const [mode, setMode] = useState<ViewMode>("copy");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) =>
      (category === "All" || item.category === category) &&
      (!needle || `${item.title} ${item.copy} ${item.category}`.toLowerCase().includes(needle)),
    );
  }, [category, items, query]);

  async function sharePage() {
    if (navigator.share) await navigator.share({ title: "Top 100 Funniest Things Ever", url: window.location.href });
    else await navigator.clipboard.writeText(window.location.href);
  }

  const Card = mode === "copy" ? CopyCard : mode === "diagram" ? DiagramCard : mode === "image" ? ImageCard : VideoCard;

  return (
    <>
      <div className="sticky top-12 z-20 -mx-4 border-y border-zinc-800 bg-zinc-950/90 px-4 py-3 backdrop-blur md:mx-0 md:rounded-xl md:border">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex overflow-x-auto rounded-lg bg-zinc-900 p-1" role="tablist" aria-label="Presentation mode">
            {modes.map(({ id, label, icon: Icon }) => (
              <button key={id} role="tab" aria-selected={mode === id} onClick={() => setMode(id)} className={`flex min-w-24 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${mode === id ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-100"}`}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-56">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <span className="sr-only">Search funny things</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search all 100…" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none focus:border-emerald-500" />
            </label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category" className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-emerald-500">
              <option>All</option>{categories.map((name) => <option key={name}>{name}</option>)}
            </select>
            <button onClick={sharePage} className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-emerald-500 hover:text-emerald-400"><Share2 className="h-4 w-4" /> Share</button>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-zinc-500">
        <span>{filtered.length} of 100 things</span><span className="capitalize">{mode} mode</span>
      </div>

      {filtered.length ? (
        <div className={`mt-5 grid gap-5 ${mode === "diagram" ? "xl:grid-cols-2" : mode === "video" ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-3"}`}>
          {filtered.map((item) => <Card key={item.rank} item={item} />)}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-zinc-700 p-12 text-center">
          <p className="text-lg font-medium text-zinc-200">No laughs found</p>
          <p className="mt-2 text-sm text-zinc-500">Try a broader search or choose All categories.</p>
        </div>
      )}
    </>
  );
}
