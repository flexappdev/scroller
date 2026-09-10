"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bookmark, Heart, History, User, ArrowRight } from "lucide-react";
import { useLikesSaves, readHistory } from "@/lib/likes-saves";

export default function MeStats() {
  const { liked, saved, hydrated } = useLikesSaves();
  const [historyCount, setHistoryCount] = useState(0);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    setHistoryCount(readHistory().length);
    try { setPoints(Number(localStorage.getItem("scroller-points") || 0) || 0); } catch {}
    const sync = () => setHistoryCount(readHistory().length);
    window.addEventListener("scroller:likes-saves-change", sync);
    return () => window.removeEventListener("scroller:likes-saves-change", sync);
  }, [hydrated]);

  return (
    <section className="mt-6">
      <div className="flex items-center gap-3 rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>
        <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--accent)", color: "black" }}>
          <User className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <div className="font-black">Anonymous scroller</div>
          <div className="text-xs" style={{ color: "var(--foreground-muted)" }}>Local profile · saved to this browser</div>
        </div>
        <span className="ml-auto rounded-full border px-3 py-1 text-[10px] uppercase tracking-wider font-mono" style={{ borderColor: "var(--border)", color: "var(--accent)" }}>{points} pts</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat icon={<Bookmark className="h-4 w-4" />} label="Favorites" value={hydrated ? saved.size : 0} />
        <Stat icon={<Heart className="h-4 w-4" />} label="Likes" value={hydrated ? liked.size : 0} />
        <Stat icon={<History className="h-4 w-4" />} label="History" value={hydrated ? historyCount : 0} />
      </div>

      <Link
        href="/saved"
        className="mt-4 flex items-center justify-between rounded-2xl border px-5 py-4 text-sm font-black hover:text-white transition-colors"
        style={{ borderColor: "var(--border)", background: "var(--surface-soft)", color: "var(--accent)" }}
      >
        <span>Open your Saved page</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono" style={{ color: "var(--foreground-muted)" }}>{icon} {label}</div>
      <div className="mt-1 text-2xl font-black tabular-nums">{value}</div>
    </div>
  );
}
