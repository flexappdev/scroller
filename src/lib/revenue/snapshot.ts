// Cross-site revenue telemetry for ABC (BL-081, BL-118). Evidence only:
// a figure is null (unknown) unless a provider report or ledger entry backs it.
import { readAdSense, readGa4Events, TRACKED_EVENTS, type SourceStatus } from "./google";
import { readLedger, type LedgerEntry } from "./ledger";
import { probeSite, type SiteProbe } from "./probe";
import { REVENUE_LADDER_USD, REVENUE_SITES, siteForHost, type RevenueSiteId } from "./sites";

type Period = "today" | "yesterday" | "last_7d";
type Money = number | null;

function londonDate(offsetDays = 0, now = new Date()): string {
  const d = new Date(now.getTime() + offsetDays * 86_400_000);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const v = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${v("year")}-${v("month")}-${v("day")}`;
}

function inPeriod(date: string, period: Period, days: Record<Period, [string, string]>) {
  const [start, end] = days[period];
  return date >= start && date <= end;
}

function add(a: Money, b: Money): Money {
  if (a === null) return b;
  if (b === null) return a;
  return Math.round((a + b) * 100) / 100;
}

function ledgerUsd(entry: LedgerEntry): number | null {
  if (entry.currency === "USD") return entry.amount;
  const rate = Number(process.env[`REVENUE_${entry.currency}_USD`]);
  return Number.isFinite(rate) && rate > 0 ? entry.amount * rate : null;
}

export type SiteSnapshot = {
  id: RevenueSiteId;
  domain: string;
  revenue_usd: Record<Period, Money>;
  adsense: Record<Period, { earnings_usd: Money; page_views: number | null; clicks: number | null }>;
  amazon: Record<Period, { earnings_usd: Money }>;
  ga4_events: Record<Period, Record<string, number> | null>;
  live: SiteProbe | null;
};

export async function getRevenueSnapshot({ probe = true, now = new Date() } = {}) {
  const days: Record<Period, [string, string]> = {
    today: [londonDate(0, now), londonDate(0, now)],
    yesterday: [londonDate(-1, now), londonDate(-1, now)],
    last_7d: [londonDate(-6, now), londonDate(0, now)],
  };
  const periods = Object.keys(days) as Period[];
  const [start, end] = days.last_7d;

  const [adsense, ga4, ledger, probes] = await Promise.all([
    readAdSense(start, end),
    readGa4Events(start, end),
    readLedger(),
    probe ? Promise.all(REVENUE_SITES.map(probeSite)) : Promise.resolve(null),
  ]);

  const sites: SiteSnapshot[] = REVENUE_SITES.map((site, index) => {
    const adsenseRows = adsense.rows.filter((r) => siteForHost(r.domain)?.id === site.id);
    const ledgerRows = ledger.entries.filter((e) => e.site === site.id && e.source === "amazon");
    const gaRows = ga4.rows.filter((r) => siteForHost(r.host)?.id === site.id);

    const per = <T,>(fn: (period: Period) => T) =>
      Object.fromEntries(periods.map((p) => [p, fn(p)])) as Record<Period, T>;

    const adsensePer = per((p) => {
      if (adsense.source.status !== "connected") return { earnings_usd: null, page_views: null, clicks: null };
      const rows = adsenseRows.filter((r) => inPeriod(r.date, p, days));
      return {
        earnings_usd: Math.round(rows.reduce((s, r) => s + r.earningsUsd, 0) * 100) / 100,
        page_views: rows.reduce((s, r) => s + r.pageViews, 0),
        clicks: rows.reduce((s, r) => s + r.clicks, 0),
      };
    });
    const amazonPer = per((p) => {
      const rows = ledgerRows.filter((e) => inPeriod(e.date, p, days));
      if (!rows.length) return { earnings_usd: null };
      return { earnings_usd: rows.reduce<Money>((s, e) => add(s, ledgerUsd(e)), null) };
    });
    const gaPer = per((p) => {
      if (ga4.source.status !== "connected") return null;
      const counts: Record<string, number> = Object.fromEntries(TRACKED_EVENTS.map((e) => [e, 0]));
      for (const r of gaRows) if (inPeriod(r.date, p, days)) counts[r.event] = (counts[r.event] ?? 0) + r.count;
      return counts;
    });

    return {
      id: site.id,
      domain: site.domain,
      revenue_usd: per((p) => add(adsensePer[p].earnings_usd, amazonPer[p].earnings_usd)),
      adsense: adsensePer,
      amazon: amazonPer,
      ga4_events: gaPer,
      live: probes ? probes[index] : null,
    };
  });

  const totals = Object.fromEntries(
    periods.map((p) => [p, sites.reduce<Money>((sum, s) => add(sum, s.revenue_usd[p]), null)]),
  ) as Record<Period, Money>;

  // The ladder rung is judged on the last complete day.
  const lastFullDay = totals.yesterday;
  const nextTarget = REVENUE_LADDER_USD.find((usd) => lastFullDay === null || lastFullDay < usd) ?? null;
  const rungsHit = lastFullDay === null ? 0 : REVENUE_LADDER_USD.filter((usd) => lastFullDay >= usd).length;

  // Rows shaped for ABC's finance ledger (lib/control-plane finance.entries).
  const finance_entries = sites.flatMap((s) =>
    (["adsense", "amazon"] as const).flatMap((source) => {
      const amount = source === "adsense" ? s.adsense.yesterday.earnings_usd : s.amazon.yesterday.earnings_usd;
      return amount === null
        ? []
        : [{ date: days.yesterday[0], app: "scroller", site: s.id, kind: "revenue", source, amount, currency: "USD", forecast: false }];
    }),
  );

  const sources: Record<string, SourceStatus | { status: string; entries: number; error?: string }> = {
    adsense: adsense.source,
    ga4: ga4.source,
    amazon_ledger: { status: ledger.error ? "error" : "connected", entries: ledger.entries.length, ...(ledger.error ? { error: ledger.error } : {}) },
  };

  return {
    agent: "scrollai",
    schema: "ms-scroll-revenue/v1",
    generated_at: now.toISOString(),
    timezone: "Europe/London",
    currency: "USD",
    periods: days,
    ladder: {
      rungs_usd: REVENUE_LADDER_USD,
      rungs_hit: rungsHit,
      next_target_usd: nextTarget,
      last_full_day_usd: lastFullDay,
      gap_usd: lastFullDay !== null && nextTarget !== null ? Math.round((nextTarget - lastFullDay) * 100) / 100 : null,
    },
    totals_usd: totals,
    sites,
    sources,
    finance_entries,
    policy: "Evidence only: unconnected or missing provider data is null (unknown), never zero.",
  };
}
