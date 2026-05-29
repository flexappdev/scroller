"use client";

import { useState } from "react";
import type { AppEntry } from "@/lib/fetchers";
import PageBrowser from "@/components/PageBrowser";
import ItemModal, { type ItemModalDetail } from "@/components/ItemModal";
import type { Card as ScrollerCard } from "@/components/ScrollerFeed";

export default function AppsClient({ apps }: { apps: AppEntry[] }) {
  const [modal, setModal] = useState<ItemModalDetail | null>(null);

  function openApp(a: AppEntry) {
    setModal({
      id: `app:${a.id}`,
      title: a.display_name,
      subtitle: `${a.domain_name} · ${a.subdomain}`,
      description: a.monorepo ? `${a.monorepo} · ${a.subdomain} · ${a.proptype}` : `placeholder · ${a.subdomain}`,
      accent: a.accent,
      internalHref: `/items/${encodeURIComponent(`app:${a.id}`)}`,
    });
  }

  return (
    <>
      <PageBrowser<AppEntry>
        pageKey="apps"
        items={apps}
        placeholder={`Search ${apps.length} apps…`}
        searchFields={(a) => `${a.id} ${a.display_name} ${a.monorepo ?? ""} ${a.domain_name} ${a.subdomain} ${a.proptype}`}
        alphaOf={(a) => a.display_name}
        rankOf={(a, i) => (a.placeholder ? 9999 + i : i)}
        toScrollerCard={(a): ScrollerCard => ({ kind: "app", id: a.id, display_name: a.display_name, domain_name: a.domain_name, subdomain: a.subdomain, accent: a.accent })}
        renderGrid={(filtered) => (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => openApp(a)}
                className={`text-left rounded-lg border border-zinc-800 p-4 transition-colors hover:border-zinc-700 ${a.placeholder ? "bg-zinc-950/60" : "bg-zinc-900/60"}`}
                style={{ borderLeftWidth: 3, borderLeftColor: a.accent }}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold ${a.placeholder ? "text-zinc-500" : "text-zinc-100"}`}>{a.display_name}</h3>
                  <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase text-zinc-400">{a.proptype}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{a.monorepo ? `${a.monorepo} · ${a.subdomain}` : `placeholder · ${a.subdomain}`}</p>
                {(a.port_v1 || a.port_v2) && (
                  <p className="mt-2 font-mono text-[10px] text-zinc-500">
                    {a.port_v1 && `v1:${a.port_v1}`} {a.port_v2 && `v2:${a.port_v2}`}
                  </p>
                )}
              </button>
            ))}
          </section>
        )}
        renderList={(filtered) => (
          <ul className="space-y-1.5">
            {filtered.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => openApp(a)}
                  className={`w-full text-left flex items-center gap-3 rounded-md border border-zinc-800/60 px-4 py-2.5 transition-colors hover:border-emerald-700/50 ${a.placeholder ? "bg-zinc-950/40" : "bg-zinc-900/40"}`}
                  style={{ borderLeftWidth: 3, borderLeftColor: a.accent }}
                >
                  <span className={`text-sm font-medium ${a.placeholder ? "text-zinc-500" : "text-zinc-100"} truncate`}>{a.display_name}</span>
                  <span className="text-[10px] font-mono text-zinc-500">{a.monorepo ?? "placeholder"}</span>
                  <span className="ml-auto text-[10px] uppercase text-zinc-500 font-mono">{a.proptype}</span>
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
