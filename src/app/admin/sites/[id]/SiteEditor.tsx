"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SiteRow } from "@/lib/cms/sites";

const CATEGORIES = ["tech", "design", "travel", "news", "other"];
const STATUSES = ["draft", "published"];

export function SiteEditor({ site }: { site: SiteRow }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: site.title,
    url: site.url,
    description: site.description ?? "",
    category: site.category,
    accent: site.accent ?? "",
    favicon_url: site.favicon_url ?? "",
    status: site.status,
    sort_order: site.sort_order,
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm({ ...form, [k]: v });
    setSaved(false);
  }

  function save() {
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/sites/${encodeURIComponent(site.id)}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error || `Failed (${res.status})`);
          return;
        }
        setSaved(true);
        router.refresh();
      } catch {
        setError("Network error.");
      }
    });
  }

  function del() {
    if (!confirm(`Delete site "${site.id}"? This cannot be undone.`)) return;
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/sites/${encodeURIComponent(site.id)}`, { method: "DELETE" });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error || `Failed (${res.status})`);
          return;
        }
        router.push("/admin/sites");
      } catch {
        setError("Network error.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Title
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-600 outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Sort order
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => set("sort_order", Number(e.target.value))}
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 font-mono focus:border-emerald-600 outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        URL
        <input
          type="url"
          value={form.url}
          onChange={(e) => set("url", e.target.value)}
          className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-600 outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Description
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-600 outline-none resize-y"
        />
      </label>

      <div className="grid gap-4 grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Category
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-600 outline-none"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Status
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value as "draft" | "published")}
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-600 outline-none"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Accent (hex)
          <input
            type="text"
            value={form.accent}
            onChange={(e) => set("accent", e.target.value)}
            placeholder="#10b981"
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 font-mono focus:border-emerald-600 outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Favicon URL
        <input
          type="url"
          value={form.favicon_url}
          onChange={(e) => set("favicon_url", e.target.value)}
          placeholder="https://example.com/favicon.ico"
          className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-600 outline-none"
        />
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {saved && <p className="text-xs text-emerald-400">Saved.</p>}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800">
        <button
          onClick={del}
          disabled={pending}
          className="rounded-md border border-red-900 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-950/40 transition-colors disabled:opacity-50"
          type="button"
        >
          Delete site
        </button>
        <button
          onClick={save}
          disabled={pending}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-60"
          type="button"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
