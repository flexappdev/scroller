#!/usr/bin/env node
// Local cron runner — invokes the Next.js /api/wiki/sync endpoint.
// Usage:
//   node scripts/wiki-sync.mjs            # all enabled seeds
//   node scripts/wiki-sync.mjs --force    # include disabled seeds
//   node scripts/wiki-sync.mjs --seed cat-physics
//   node scripts/wiki-sync.mjs --title "Albert Einstein" --category manual
//
// Env:
//   SCROLLER_URL   default http://localhost:19013
//   CRON_SECRET    sent as Bearer header (and ?secret= for safety)

const SCROLLER_URL = process.env.SCROLLER_URL || "http://localhost:19013";
const CRON_SECRET = process.env.CRON_SECRET || "";

function parseArgs(argv) {
  const args = { force: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") args.force = true;
    else if (a === "--seed") args.seed = argv[++i];
    else if (a === "--title") args.title = argv[++i];
    else if (a === "--category") args.category = argv[++i];
    else if (a === "--help" || a === "-h") {
      console.log(`Usage:
  node scripts/wiki-sync.mjs                 # all enabled seeds
  node scripts/wiki-sync.mjs --force         # include disabled seeds
  node scripts/wiki-sync.mjs --seed <id>     # one seed
  node scripts/wiki-sync.mjs --title "<t>" [--category <c>]   # one article`);
      process.exit(0);
    }
  }
  return args;
}

const args = parseArgs(process.argv);
const body = {};
if (args.force) body.forceAll = true;
if (args.seed) body.seedIds = [args.seed];
if (args.title) {
  body.title = args.title;
  if (args.category) body.category = args.category;
}

const url = new URL("/api/wiki/sync", SCROLLER_URL);
if (CRON_SECRET) url.searchParams.set("secret", CRON_SECRET);

const start = Date.now();
console.log(`[wiki-sync] POST ${url.toString()}`);
console.log(`[wiki-sync] body: ${JSON.stringify(body)}`);

const res = await fetch(url, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    ...(CRON_SECRET ? { authorization: `Bearer ${CRON_SECRET}` } : {}),
  },
  body: JSON.stringify(body),
});

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  json = { raw: text };
}
const ms = Date.now() - start;
console.log(`[wiki-sync] HTTP ${res.status} in ${ms}ms`);
console.log(JSON.stringify(json, null, 2));
process.exit(res.ok ? 0 : 1);
