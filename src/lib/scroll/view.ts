export type ViewMode = "scroller" | "list" | "grid";
export type SortMode = "ranked" | "alpha" | "random";

export const VIEW_MODES: ViewMode[] = ["scroller", "list", "grid"];
export const SORT_MODES: SortMode[] = ["ranked", "alpha", "random"];

// Daily-seeded deterministic shuffle — same seed → same order across reloads
// inside the same day, but rotates each day.
export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function dailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
