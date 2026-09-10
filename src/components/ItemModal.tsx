"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import DetailSidebar from "./DetailSidebar";

export type ItemModalAction = {
  href: string;
  label: string;
  external?: boolean;
  primary?: boolean;
};

export type ItemModalEmbed = { kind: "youtube" | "mp4"; url: string };

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
  embed?: ItemModalEmbed;
};

export function youtubeEmbedFrom(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const m = u.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/);
      if (m) return `https://www.youtube.com/embed/${m[1]}`;
    }
    return null;
  } catch { return null; }
}

const SIDE_PANEL_BREAKPOINT_PX = 1024; // lg
const PREVIEW_OPEN_FLAG = "data-preview-open";

export default function ItemModal({
  item,
  onClose,
}: {
  item: ItemModalDetail | null;
  onClose: () => void;
}) {
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

  const body = (
    <>
      <button
        onClick={onClose}
        className="absolute right-3 top-3 z-10 rounded-full bg-zinc-900/80 p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
      <DetailSidebar item={item} onClose={onClose} onNavigate={onClose} />
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
