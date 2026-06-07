"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ExternalLink, ArrowUpRight, Link as LinkIcon, Check } from "lucide-react";

export type ItemModalAction = {
  href: string;
  label: string;
  external?: boolean;
  primary?: boolean;
};

export type ItemModalDetail = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string | null;
  image?: string | null;
  url?: string;
  urlLabel?: string;
  accent?: string;
  internalHref?: string;
  extraActions?: ItemModalAction[];
};

const SIDE_PANEL_BREAKPOINT_PX = 1024; // lg
const PREVIEW_OPEN_FLAG = "data-preview-open";

export default function ItemModal({
  item,
  onClose,
}: {
  item: ItemModalDetail | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  // null until hydration finishes so SSR doesn't pick the wrong layout.
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(min-width: ${SIDE_PANEL_BREAKPOINT_PX}px)`);
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!item) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // Lock body scroll only in overlay mode (mobile). Side panel coexists
    // with the page underneath so users can keep browsing the grid.
    if (isDesktop === false) document.body.style.overflow = "hidden";
    // Side-panel signal for CSS — AppShell reads this to shift `main` left.
    if (isDesktop) document.documentElement.setAttribute(PREVIEW_OPEN_FLAG, "1");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.documentElement.removeAttribute(PREVIEW_OPEN_FLAG);
    };
  }, [item, onClose, isDesktop]);

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

  const body = (
    <>
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
        <h2 className="text-xl font-semibold text-zinc-100 break-words">{item.title}</h2>
        {item.description && (
          <p className="text-sm text-zinc-400 whitespace-pre-line">{item.description}</p>
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
          {item.extraActions?.map((a) =>
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
            ),
          )}
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
    </>
  );

  // Desktop (lg+): right side-panel — keep the grid visible on the left,
  // AppShell shrinks `main` via the data-preview-open flag.
  if (isDesktop) {
    return (
      <aside
        className="fixed top-12 bottom-12 right-0 z-40 w-[28rem] max-w-[90vw] border-l border-zinc-800 bg-zinc-950 shadow-2xl overflow-y-auto"
        role="dialog"
        aria-modal="false"
        aria-label={`Preview: ${item.title}`}
        style={item.accent ? { borderTopWidth: 3, borderTopColor: item.accent } : undefined}
      >
        {body}
      </aside>
    );
  }

  // Mobile / pre-hydration: classic overlay modal.
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={item.accent ? { borderTopWidth: 3, borderTopColor: item.accent } : undefined}
      >
        {body}
      </div>
    </div>
  );
}
