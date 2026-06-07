// Generate one PNG hero per Top-100 AI prompt and upload to
// s3://com27/scroller/prompts/<slug>.png. Uses sharp + an SVG template so the
// 100 images render in <30s, no model calls. Mat can swap any of them later via
// `/iad "<act>"` — the slug convention is identical.

import fs from "node:fs";
import sharp from "sharp";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const envText = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const env = (k) => envText.match(new RegExp("^" + k + "=(.*)", "m"))?.[1] || "";

const s3 = new S3Client({
  region: "eu-west-2",
  credentials: { accessKeyId: env("S3_ACCESS_KEY"), secretAccessKey: env("S3_SECRET_ACCESS_KEY") },
});

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function hashHue(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

function escapeXml(s) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
}

function svgFor(act, index) {
  const hue = hashHue(act);
  const hue2 = (hue + 50) % 360;
  const safeAct = escapeXml(act.length > 38 ? act.slice(0, 35) + "…" : act);
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${hue}, 70%, 22%)" />
        <stop offset="100%" stop-color="hsl(${hue2}, 80%, 14%)" />
      </linearGradient>
      <radialGradient id="r" cx="20%" cy="20%" r="60%">
        <stop offset="0%" stop-color="hsla(${hue}, 90%, 70%, 0.45)" />
        <stop offset="100%" stop-color="hsla(${hue}, 90%, 70%, 0)" />
      </radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#g)" />
    <rect width="1280" height="720" fill="url(#r)" />
    <text x="80" y="100" font-family="ui-monospace, Menlo, monospace" font-size="22" fill="rgba(255,255,255,0.65)" letter-spacing="0.18em" text-transform="uppercase">PROMPT · #${String(index).padStart(3, "0")}</text>
    <text x="80" y="380" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="80" fill="white">${safeAct}</text>
    <text x="80" y="620" font-family="ui-monospace, Menlo, monospace" font-size="22" fill="rgba(255,255,255,0.55)">Top 100 AI Prompts · scroller.app</text>
    <text x="80" y="660" font-family="ui-monospace, Menlo, monospace" font-size="18" fill="hsl(${hue}, 90%, 75%)">hsl(${hue}, ${hue2})</text>
  </svg>`;
}

async function fetchPrompts() {
  const r = await fetch("https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv");
  const csv = await r.text();
  // very small CSV parser sufficient for "act","prompt" header (handles quoted fields with commas/newlines)
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (inQ) {
      if (c === '"') {
        if (csv[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") {} else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.slice(1, 101).map(([act]) => act).filter(Boolean);
}

async function alreadyExists(key) {
  try { await s3.send(new HeadObjectCommand({ Bucket: "com27", Key: key })); return true; }
  catch (e) { if ((e?.name || e?.Code) === "NotFound" || e?.$metadata?.httpStatusCode === 404) return false; throw e; }
}

const force = process.argv.includes("--force");

const acts = await fetchPrompts();
console.log(`Fetched ${acts.length} prompt acts`);

const results = { ok: 0, skip: 0, fail: 0 };

for (let i = 0; i < acts.length; i++) {
  const act = acts[i];
  const key = `scroller/prompts/${slug(act)}.png`;
  try {
    if (!force && await alreadyExists(key)) { results.skip++; continue; }
    const png = await sharp(Buffer.from(svgFor(act, i + 1))).png().toBuffer();
    await s3.send(new PutObjectCommand({
      Bucket: "com27",
      Key: key,
      Body: png,
      ContentType: "image/png",
      CacheControl: "public, max-age=2592000",
    }));
    results.ok++;
    if ((i + 1) % 10 === 0 || i === acts.length - 1) console.log(`[${i + 1}/${acts.length}] last: ${act}`);
  } catch (e) {
    results.fail++;
    console.log(`FAIL ${act}: ${e.message}`);
  }
}

console.log("\n--- DONE ---", JSON.stringify(results));
