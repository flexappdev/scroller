/**
 * Taste signals for the /play feed, kept in the viewer's browser.
 * The /taste page exports them as JSON so the Editor agent can turn
 * them into the written taste brief (docs/AGENTIC-ORG.md).
 */
export type TasteState = {
  /** Positive = show more of this tag or pack, negative = less. */
  weights: Record<string, number>;
  /** Card ids never to show again. */
  never: string[];
  /** Ratio of smart to funny cards, 0..1 share of funny. */
  funnyShare: number;
  /** Free-text notes from /taste. */
  notes: { at: string; card?: string; text: string }[];
  /** Thumbs from /taste: card id -> +1 / -1. */
  votes: Record<string, 1 | -1>;
};

const KEY = "scroller-taste-v1";

export const DEFAULT_TASTE: TasteState = { weights: {}, never: [], funnyShare: 0.3, notes: [], votes: {} };

export function loadTaste(): TasteState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_TASTE };
    return { ...DEFAULT_TASTE, ...(JSON.parse(raw) as Partial<TasteState>) };
  } catch {
    return { ...DEFAULT_TASTE };
  }
}

export function saveTaste(state: TasteState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage blocked: the feed still works, it just forgets.
  }
}

/** Nudge every key (tags, pack, kind) by delta, clamped to -5..5. */
export function nudge(state: TasteState, keys: string[], delta: number): TasteState {
  const weights = { ...state.weights };
  for (const k of keys) {
    weights[k] = Math.max(-5, Math.min(5, (weights[k] ?? 0) + delta));
  }
  return { ...state, weights };
}

export function weightOf(state: TasteState, keys: string[]): number {
  const sum = keys.reduce((acc, k) => acc + (state.weights[k] ?? 0), 0);
  // exp keeps every card possible while strongly favouring liked ones.
  return Math.exp(sum * 0.35);
}

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}
