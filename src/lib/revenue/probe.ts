// Live checks that each site actually serves its ad, analytics and ads.txt
// tags in production (not just that the env is set).
import { ADSENSE_PUBLISHER_ID, type RevenueSite } from "./sites";

const TIMEOUT_MS = 5000;

export type SiteProbe = {
  checked_at: string;
  reachable: boolean;
  adsense_client: string | null;
  ga4_measurement_id: string | null;
  ads_txt: boolean | null;
  error?: string;
};

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "ScrollAI-revenue-probe/1.0 (+https://scroller.tv/api/revenue)" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 600 },
    });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

function firstMatch(text: string, pattern: RegExp) {
  const ids = [...text.matchAll(pattern)].map((m) => m[0]).filter((id) => !/^G-X+$/i.test(id));
  return ids[0] ?? null;
}

export async function probeSite(site: RevenueSite): Promise<SiteProbe> {
  const base = `https://${site.domain}`;
  // mediai.tv is static; its public IDs live in ms-scroll-config.js.
  const [html, adsTxt, mediaiConfig] = await Promise.all([
    fetchText(`${base}/`),
    fetchText(`${base}/ads.txt`),
    site.id === "mediai" ? fetchText(`${base}/ms-scroll-config.js`) : Promise.resolve(null),
  ]);
  const text = `${html ?? ""}\n${mediaiConfig ?? ""}`;
  const mediaiAdsOff = mediaiConfig !== null && /adsenseEnabled:\s*false/.test(mediaiConfig);
  const pubDigits = ADSENSE_PUBLISHER_ID.replace(/\D/g, "");

  return {
    checked_at: new Date().toISOString(),
    reachable: html !== null,
    adsense_client: mediaiAdsOff ? null : firstMatch(text, /ca-pub-\d{10,}/g),
    ga4_measurement_id: firstMatch(text, /\bG-[A-Z0-9]{6,}\b/g),
    ads_txt: adsTxt === null ? null : adsTxt.includes(`pub-${pubDigits}`),
    ...(html === null ? { error: "homepage not reachable" } : {}),
  };
}
