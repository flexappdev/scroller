// Live URLs for the 13 fleet sites + cockpit + scroller.
// Falls back to a GitHub repo link when no live URL is known yet.
// Source: memory snapshots from 2026-05-24 → 2026-05-30 ship pass.
export const FLEET_LIVE_URL: Record<string, string> = {
  appai: "https://github.com/flexappdev/appai",
  fad: "https://fad-rosy.vercel.app",
  ms: "https://ms-lake-eta.vercel.app",
  spm: "https://spm-teal.vercel.app",
  yb100: "https://yb100-khaki.vercel.app",
  fs: "https://fs-sand.vercel.app",
  sp: "https://sp-eta-eight.vercel.app",
  xmas: "https://xmas-tan-omega.vercel.app",
  wbp: "https://wbp-eta.vercel.app",
  ybl: "https://ybl-one.vercel.app",
  fi: "https://fi-mu-three.vercel.app",
  mtd: "https://mtd-rose.vercel.app",
  lituk: "https://lituk-opal.vercel.app",
  wsl: "https://github.com/flexappdev/wsl",
  scroller: "https://scroller-psi.vercel.app",
  scrollerai: "https://github.com/flexappdev/scrollerai",
  bta: "https://github.com/flexappdev/bta",
};

export function liveUrl(id: string): string {
  return FLEET_LIVE_URL[id] ?? `https://github.com/flexappdev/${id}`;
}

export function githubUrl(id: string): string {
  return `https://github.com/flexappdev/${id}`;
}
