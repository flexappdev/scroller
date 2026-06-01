"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ExternalLink, ArrowUpRight, Link as LinkIcon, Check } from "lucide-react";

export type ItemModalAction = {
  href: string;
  label: string;
  external?: boolean;     // true → opens in new tab
  primary?: boolean;      // emerald style
};

export type ItemModalDetail = {
  /** Composite id, e.g. "amazon:B07X..." or "wiki:12345" — used by /items/[id]. */
  id: string;
  title: string;
  subtitle?: string;
  description?: string | null;
  image?: string | null;
  url?: string;          // primary external URL
  urlLabel?: string;     // e.g. "Buy on Amazon", "Read on Wikipedia"
  accent?: string;
  internalHref?: string; // /items/<id> route
  /** Extra CTAs rendered after the primary url button. */
  extraActions?: ItemModalAction[];
};

export default function ItemModal({
  item,
  onClose,
}: {
  item: ItemModalDetail | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!item) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  if (!item) return null;

  async function copyLink() {
    if (!item?.internalHref) return;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    try {
      await navigator.clipboard.writeText(`${base}${item.internalHref}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-lg w-full rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={item.accent ? { borderTopWidth: 3, borderTopColor: item.accent } : undefined}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-zinc-900/80 p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {item.image && (
          <div className="relative w-full bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt={item.title} className="w-full aspect-video object-cover" />
          </div>
        )}

        <div className="p-5 space-y-3">
          {item.subtitle && (
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
              {item.subtitle}
            </div>
          )}
          <h2 className="text-xl font-semibold text-zinc-100">{item.title}</h2>
          {item.description && (
            <p className="text-sm text-zinc-400 line-clamp-[8]">{item.description}</p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {item.internalHref && (
              <Link
                href={item.internalHref}
                onClick={onClose}
                className="flex items-center gap-1.5 rounded-md border border-emerald-700/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300 hover:border-emerald-500 hover:text-emerald-200 transition-colors"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                View details
              </Link>
            )}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 hover:border-zinc-500 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {item.urlLabel ?? "Open"}
              </a>
            )}
            {item.extraActions?.map((a) => (
              a.external ? (
                <a
                  key={a.href}
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors ${
                    a.primary
                      ? "border-emerald-700/40 bg-emerald-950/40 text-emerald-300 hover:border-emerald-500"
                      : "border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-zinc-500"
                  }`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {a.label}
                </a>
              ) : (
                <Link
                  key={a.href}
                  href={a.href}
                  onClick={onClose}
                  className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors ${
                    a.primary
                      ? "border-emerald-700/40 bg-emerald-950/40 text-emerald-300 hover:border-emerald-500"
                      : "border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-zinc-500"
                  }`}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  {a.label}
                </Link>
              )
            ))}
            {item.internalHref && (
              <button
                type="button"
                onClick={copyLink}
                className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors"
                title="Copy link to this item"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <LinkIcon className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy link"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
