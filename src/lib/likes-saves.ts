"use client";

import { useCallback, useEffect, useState } from "react";

const LIKED_KEY = "scroller.mobile.liked.v1";
const SAVED_KEY = "scroller.mobile.saved.v1";
const HISTORY_KEY = "scroller.history.v1";
const HISTORY_MAX = 500;
const EVT = "scroller:likes-saves-change";

export function pushHistory(id: string, meta?: { title?: string; kind?: string; href?: string }) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list: Array<{ id: string; ts: number; title?: string; kind?: string; href?: string }> = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((x) => x.id !== id);
    filtered.unshift({ id, ts: Date.now(), ...meta });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, HISTORY_MAX)));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {}
}

export function readHistory(): Array<{ id: string; ts: number; title?: string; kind?: string; href?: string }> {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(HISTORY_KEY); window.dispatchEvent(new CustomEvent(EVT)); } catch {}
}

function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(key) || "[]") as string[]); } catch { return new Set(); }
}

function writeSet(key: string, value: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...value]));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {}
}

export function useLikesSaves() {
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLiked(readSet(LIKED_KEY));
    setSaved(readSet(SAVED_KEY));
    setHydrated(true);
    const sync = () => { setLiked(readSet(LIKED_KEY)); setSaved(readSet(SAVED_KEY)); };
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleLike = useCallback((id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      writeSet(LIKED_KEY, next);
      return next;
    });
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      writeSet(SAVED_KEY, next);
      return next;
    });
  }, []);

  return {
    liked,
    saved,
    hydrated,
    isLiked: (id: string) => liked.has(id),
    isSaved: (id: string) => saved.has(id),
    toggleLike,
    toggleSave,
  };
}
