export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

const PLACEHOLDER = /^G-X+$/i;

export function isAnalyticsEnabled(): boolean {
  if (!GA_ID) return false;
  if (PLACEHOLDER.test(GA_ID)) return false;
  return /^G-[A-Z0-9]{4,}$/i.test(GA_ID);
}

type Params = Record<string, unknown>;

interface GtagWindow {
  gtag?: (...args: unknown[]) => void;
}

export function trackEvent(name: string, params: Params = {}): void {
  if (!isAnalyticsEnabled()) return;
  if (typeof window === "undefined") return;
  const w = window as unknown as GtagWindow;
  w.gtag?.("event", name, params);
}
