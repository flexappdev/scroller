"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function NewSiteForm() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!id || !title || !url) {
      setError("ID, title, and URL are required.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/sites", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id, title, url }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error || `Failed (${res.status})`);
          return;
        }
        setId(""); setTitle(""); setUrl("");
        router.refresh();
      } catch {
        setError("Network error.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 grid gap-3" style={{ gridTemplateColumns: "1fr 2fr 3fr auto" }}>
      <input
        type="text"
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder="id (slug)"
        className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-mono text-emerald-400 placeholder:text-zinc-600 focus:border-emerald-600 outline-none"
        autoComplete="off"
      />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-600 outline-none"
        autoComplete="off"
      />
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://"
        className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-600 outline-none"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add site"}
      </button>
      {error && <p className="col-span-4 text-xs text-red-400 mt-1">{error}</p>}
    </form>
  );
}
