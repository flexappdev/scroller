#!/usr/bin/env node
/**
 * Sunday board pack for the director of the board (Mat).
 * Reads the revenue endpoint, the Scroller packs and the last 7 days of git,
 * then writes docs/board/<date>.md: numbers, what shipped, max 3 decisions.
 *
 * Usage: npm run board:pack [-- --taste path/to/taste.json]
 * Env: REVENUE_URL (default https://scroller.tv/api/revenue), REVENUE_API_TOKEN (optional).
 */
import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const date = new Date().toISOString().slice(0, 10);
const args = process.argv.slice(2);
const tastePath = args.includes("--taste") ? args[args.indexOf("--taste") + 1] : null;
const revenueUrl = process.env.REVENUE_URL || "https://scroller.tv/api/revenue";

async function revenue() {
  try {
    const res = await fetch(revenueUrl, {
      headers: process.env.REVENUE_API_TOKEN ? { authorization: `Bearer ${process.env.REVENUE_API_TOKEN}` } : {},
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return await res.json();
  } catch (error) {
    return { error: String(error?.message || error) };
  }
}

async function packs() {
  const dir = path.join(root, "data", "scrollers");
  const names = (await fs.readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  let items = 0;
  let ranked = 0;
  for (const name of names) {
    try {
      const list = JSON.parse(await fs.readFile(path.join(dir, name, "items.json"), "utf8"));
      items += list.length;
      if (list.some((i) => typeof i.rank === "number")) ranked += 1;
    } catch {
      // skip broken pack; the validator reports it
    }
  }
  return { packs: names.length, items, ranked };
}

function shipped() {
  try {
    return execSync('git log --since="7 days ago" --pretty=format:"- %s (%h)" --no-merges', { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const money = (v) => (v === null || v === undefined ? "not connected" : typeof v === "number" ? v.toFixed(2) : String(v));

function pickNumber(obj, keys) {
  for (const k of keys) {
    const v = k.split(".").reduce((o, part) => (o && typeof o === "object" ? o[part] : undefined), obj);
    if (v !== undefined) return v;
  }
  return null;
}

const [rev, content] = await Promise.all([revenue(), packs()]);
const taste = tastePath ? JSON.parse(await fs.readFile(tastePath, "utf8")) : null;
const log = shipped();

// Shape: ms-scroll-revenue/v1 (docs/REVENUE-TELEMETRY.md on scroller#17). Unconnected sources are null.
const sites = Array.isArray(rev.sites) ? rev.sites : [];
const sumOf = (fn) => {
  const vals = sites.map(fn).filter((v) => typeof v === "number");
  return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
};
const total7d = pickNumber(rev, ["totals_usd.last_7d"]);
const yesterday = pickNumber(rev, ["totals_usd.yesterday"]);
const pageViews = sumOf((s) => s?.ga4_events?.page_view);
const affiliateClicks = sumOf((s) => s?.ga4_events?.affiliate_click);
const adsense = sumOf((s) => s?.adsense?.earnings_usd ?? s?.adsense?.earnings);

const decisions = [];
if (rev.error) {
  decisions.push(`Revenue endpoint unreachable (${rev.error}). Merge scroller#17 and set the Google OAuth env vars, or fly blind another week.`);
  decisions.push("AdSense: reactivate pub-1457156776981797 and submit (Runway date 16 Nov).");
}
if (!rev.error && pageViews === null) decisions.push("GA4 is not reporting. Add the G- measurement ID and numeric property ID to Vercel.");
if (!rev.error && adsense === null) decisions.push("AdSense not connected. Reactivate pub-1457156776981797 and submit wikai.tv or scroller.tv.");
while (decisions.length > 3) decisions.pop();
if (decisions.length === 0) decisions.push("No blockers. Default: keep the plan; approve next week's theme.");

const likes = taste
  ? Object.entries(taste.taste?.weights ?? {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, w]) => `${k} (+${Number(w).toFixed(1)})`)
      .join(", ")
  : null;

const md = `# Board pack, ${date}

Read in 5 minutes, decide in 30. No reply means the recommended default applies.

## Numbers (last 7 days)

| Metric | Value |
| --- | --- |
| Revenue, last 7 days (USD) | ${money(total7d)} |
| Revenue, yesterday (USD, $1/day rung) | ${money(yesterday)} |
| AdSense, last 7 days (USD) | ${money(adsense)} |
| Page views (GA4) | ${pageViews ?? "not connected"} |
| Affiliate clicks (GA4) | ${affiliateClicks ?? "not connected"} |
| Packs live | ${content.packs} (${content.ranked} ranked, used for duels) |
| Cards in the Play deck | ${content.items} kbits + 100 fbits |
${likes ? `| Top taste signals | ${likes} |\n` : ""}
## Shipped

${log || "- Nothing merged this week."}

## Decisions (max 3)

${decisions.map((d, i) => `${i + 1}. [ ] ${d}`).join("\n")}

## Next week

See the 7-week plan: https://claude.ai/artifact/87XuKAEzktzkSTESnX4NP1
`;

const out = path.join(root, "docs", "board", `${date}.md`);
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, md);
console.log(md);
console.error(`Wrote ${path.relative(root, out)}`);
