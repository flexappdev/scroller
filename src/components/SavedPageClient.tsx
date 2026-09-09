"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";

type SavedRow = {
  id: string;
  topic: string;
  sourceUrl: string;
  imageUrl: string | null;
  savedAt: number;
};

const KEY = "scroller:saved";

function readSaved(): SavedRow[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function SavedPageClient() {
  const [rows, setRows] = useState<SavedRow[]>([]);

  const sync = useCallback(() => setRows(readSaved()), []);

  useEffect(() => {
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("scroller:saved-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("scroller:saved-changed", sync);
    };
  }, [sync]);

  function remove(id: string) {
    const next = rows.filter((row) => row.id !== id);
    localStorage.setItem(KEY, JSON.stringify(next));
    setRows(next);
  }

  if (rows.length === 0) {
    return (
      <section className="mt-8 rounded-2xl border p-6 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>
        <p className="font-black">Nothing saved yet.</p>
        <p className="mt-2 text-sm" style={{ color: "var(--foreground-muted)" }}>Tap the bookmark button on any Home card.</p>
        <Link href="/" className="mt-5 inline-flex rounded-xl px-4 py-3 text-sm font-black text-black" style={{ background: "var(--accent)" }}>
          Open random Home
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-8 grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <article key={row.id} className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>
          {row.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.imageUrl} alt="" className="aspect-video w-full object-cover" />
          ) : null}
          <div className="p-4">
            <h2 className="font-black">{row.topic}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/?card=${encodeURIComponent(row.id)}`} className="rounded-lg px-3 py-2 text-xs font-black text-black" style={{ background: "var(--accent)" }}>
                Open in Home
              </Link>
              <a href={row.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold" style={{ borderColor: "var(--border)" }}>
                Source <ExternalLink className="h-3 w-3" />
              </a>
              <button type="button" onClick={() => remove(row.id)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold" style={{ borderColor: "var(--border)" }}>
                Remove <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
