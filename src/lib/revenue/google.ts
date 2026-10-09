// Server-only readers for Google's reporting APIs. One OAuth refresh token with
// the adsense.readonly and analytics.readonly scopes covers both.
import { ADSENSE_PUBLISHER_ID } from "./sites";

export type SourceStatus =
  | { status: "connected" }
  | { status: "not-configured"; missing: string[] }
  | { status: "error"; error: string };

export type DateKey = string; // YYYY-MM-DD

const TIMEOUT_MS = 8000;

function oauthEnv() {
  const env = {
    GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID?.trim(),
    GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim(),
    GOOGLE_OAUTH_REFRESH_TOKEN: process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim(),
  };
  const missing = Object.entries(env)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  return { env, missing };
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const { env } = oauthEnv();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET!,
      refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`OAuth token refresh failed (${res.status})`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function ymd(key: DateKey) {
  const [year, month, day] = key.split("-");
  return { year, month: String(Number(month)), day: String(Number(day)) };
}

export type AdSenseRow = { date: DateKey; domain: string; earningsUsd: number; pageViews: number; impressions: number; clicks: number };

/** AdSense Management API v2 report, by date and domain, in USD. */
export async function readAdSense(start: DateKey, end: DateKey): Promise<{ source: SourceStatus; rows: AdSenseRow[] }> {
  const { missing } = oauthEnv();
  if (missing.length) return { source: { status: "not-configured", missing }, rows: [] };

  try {
    const s = ymd(start);
    const e = ymd(end);
    const params = new URLSearchParams({
      dateRange: "CUSTOM",
      "startDate.year": s.year,
      "startDate.month": s.month,
      "startDate.day": s.day,
      "endDate.year": e.year,
      "endDate.month": e.month,
      "endDate.day": e.day,
      currencyCode: "USD",
      reportingTimeZone: "ACCOUNT_TIME_ZONE",
    });
    for (const d of ["DATE", "DOMAIN_NAME"]) params.append("dimensions", d);
    for (const m of ["ESTIMATED_EARNINGS", "PAGE_VIEWS", "IMPRESSIONS", "CLICKS"]) params.append("metrics", m);

    const account = ADSENSE_PUBLISHER_ID.startsWith("accounts/") ? ADSENSE_PUBLISHER_ID : `accounts/${ADSENSE_PUBLISHER_ID}`;
    const res = await fetch(`https://adsense.googleapis.com/v2/${account}/reports:generate?${params}`, {
      headers: { authorization: `Bearer ${await accessToken()}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`AdSense report failed (${res.status})`);
    const json = (await res.json()) as { rows?: { cells: { value?: string }[] }[] };
    const rows = (json.rows ?? []).map(({ cells }) => ({
      date: cells[0]?.value ?? "",
      domain: (cells[1]?.value ?? "").toLowerCase(),
      earningsUsd: Number(cells[2]?.value ?? 0),
      pageViews: Number(cells[3]?.value ?? 0),
      impressions: Number(cells[4]?.value ?? 0),
      clicks: Number(cells[5]?.value ?? 0),
    }));
    return { source: { status: "connected" }, rows };
  } catch (error) {
    return { source: { status: "error", error: errorMessage(error) }, rows: [] };
  }
}

export const TRACKED_EVENTS = ["page_view", "affiliate_click", "outbound_click", "ad_slot_view"] as const;

export type Ga4Row = { date: DateKey; host: string; event: string; count: number };

/** GA4 Data API: revenue-relevant event counts by date and hostname. */
export async function readGa4Events(start: DateKey, end: DateKey): Promise<{ source: SourceStatus; rows: Ga4Row[] }> {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const { missing } = oauthEnv();
  if (!propertyId) missing.push("GA4_PROPERTY_ID");
  if (missing.length) return { source: { status: "not-configured", missing }, rows: [] };

  try {
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: "POST",
      headers: { authorization: `Bearer ${await accessToken()}`, "content-type": "application/json" },
      body: JSON.stringify({
        dateRanges: [{ startDate: start, endDate: end }],
        dimensions: [{ name: "date" }, { name: "hostName" }, { name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: { fieldName: "eventName", inListFilter: { values: [...TRACKED_EVENTS] } },
        },
        limit: 10000,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`GA4 report failed (${res.status})`);
    const json = (await res.json()) as {
      rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
    };
    const rows = (json.rows ?? []).map(({ dimensionValues, metricValues }) => {
      const raw = dimensionValues[0]?.value ?? "";
      return {
        date: `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`,
        host: (dimensionValues[1]?.value ?? "").toLowerCase(),
        event: dimensionValues[2]?.value ?? "",
        count: Number(metricValues[0]?.value ?? 0),
      };
    });
    return { source: { status: "connected" }, rows };
  } catch (error) {
    return { source: { status: "error", error: errorMessage(error) }, rows: [] };
  }
}
