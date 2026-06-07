"use client";

import { useState } from "react";
import type { AppEntry } from "@/lib/fetchers";
import PageBrowser from "@/components/PageBrowser";
import ItemModal, { type ItemModalDetail } from "@/components/ItemModal";
import type { Card as ScrollerCard } from "@/components/ScrollerFeed";
import { liveUrl, githubUrl } from "@/lib/scroll/fleet-urls";

const S3_PUBLIC_BASE = "https://com27.s3.eu-west-2.amazonaws.com";
const screenshotFor = (id: string) => `${S3_PUBLIC_BASE}/scroller/screenshots/${id}.png`;

export default function AppsClient({ apps }: { apps: AppEntry[] }) {
  const [modal, setModal] = useState<ItemModalDetail | null>(null);

  function openApp(a: AppEntry) {
    if (a.placeholder) {
      setModal({
        id: `app:${a.id}`,
        title: a.display_name,
        subtitle: `${a.domain_name} · ${a.subdomain}`,
        description: `Slot reserved · ${a.subdomain}. Real app TBD.`,
        accent: a.accent,
        internalHref: `/items/${encodeURIComponent(`app:${a.id}`)}`,
      });
      return;
    }
    const live = liveUrl(a.id);
    const gh = githubUrl(a.id);
    const isLive = !live.includes("github.com");
    setModal({
      id: `app:${a.id}`,
      title: a.display_name,
      subtitle: `${a.domain_name} · ${a.subdomain}`,
      description: a.monorepo ? `${a.monorepo} · ${a.subdomain} · ${a.proptype}` : `${a.subdomain} · ${a.proptype}`,
      accent: a.accent,
      url: isLive ? live : gh,
      urlLabel: isLive ? "Open app" : "View on GitHub",
      internalHref: `/items/${encodeURIComponent(`app:${a.id}`)}`,
      extraActions: isLive ? [{ href: gh, label: "View on GitHub", external: true }] : [],
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
                className={`text-left rounded-lg border border-zinc-800 overflow-hidden transition-colors hover:border-zinc-700 ${a.placeholder ? "bg-zinc-950/60" : "bg-zinc-900/60"}`}
                style={{ borderLeftWidth: 3, borderLeftColor: a.accent }}
              >
                {!a.placeholder && (
                  <div className="aspect-[16/9] bg-zinc-900 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screenshotFor(a.id)}
                      alt={a.display_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold ${a.placeholder ? "text-zinc-500" : "text-zinc-100"}`}>{a.display_name}</h3>
                    <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase text-zinc-400">{a.proptype}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{a.monorepo ? `${a.monorepo} · ${a.subdomain}` : `placeholder · ${a.subdomain}`}</p>
                  {!a.placeholder && (
                    <p className="mt-1 text-[10px] font-mono text-emerald-400/70 truncate">{liveUrl(a.id)}</p>
                  )}
                  {(a.port_v1 || a.port_v2) && (
                    <p className="mt-1 font-mono text-[10px] text-zinc-500">
                      {a.port_v1 && `v1:${a.port_v1}`} {a.port_v2 && `v2:${a.port_v2}`}
                    </p>
                  )}
                </div>
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
