// Replace SVG-gradient prompt heroes with Runware FLUX AI-generated images.
// Fetches 100 prompts from f/awesome-chatgpt-prompts, generates a 1024x1024
// hero for each via the Runware API (model: runware:100@1 = FLUX Schnell),
// downloads the result, and uploads to s3://com27/scroller/prompts/<slug>.png.
//
// Usage:
//   node scripts/generate-prompt-images-runware.mjs [--limit=N] [--skip-existing]
//
// Env (reads .env.local first, then ~/context-2026/agents/.env):
//   RUNWARE_API_KEY
//   S3_ACCESS_KEY, S3_SECRET_ACCESS_KEY

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import os from "node:os";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

// ── Env loading ───────────────────────────────────────────────────────────────

function parseEnv(text) {
  const out = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

function loadEnv() {
  const sources = [
    new URL("../.env.local", import.meta.url).pathname,
    path.join(os.homedir(), "context-2026/agents/.env"),
  ];
  for (const f of sources) {
    if (fs.existsSync(f)) {
      const vars = parseEnv(fs.readFileSync(f, "utf8"));
      if (vars.RUNWARE_API_KEY) return vars;
    }
  }
  throw new Error("RUNWARE_API_KEY not found in .env.local or ~/context-2026/agents/.env");
}

const ENV = loadEnv();
const RUNWARE_API_KEY = ENV.RUNWARE_API_KEY;
const S3_BUCKET = "com27";
const S3_PREFIX = "scroller/prompts";
const S3_REGION = "eu-west-2";

const s3 = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: ENV.S3_ACCESS_KEY,
    secretAccessKey: ENV.S3_SECRET_ACCESS_KEY,
  },
});

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : 100;
const SKIP_EXISTING = args.includes("--skip-existing");

// ── Helpers ───────────────────────────────────────────────────────────────────

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function s3Exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

// ── Runware API ───────────────────────────────────────────────────────────────

const RUNWARE_BASE = "https://api.runware.ai/v1";

async function runwareGenerate(prompt, retries = 3) {
  const body = JSON.stringify([
    {
      taskType: "imageInference",
      taskUUID: crypto.randomUUID(),
      positivePrompt: prompt,
      model: "runware:100@1",      // FLUX Schnell — fast, good quality
      width: 1024,
      height: 1024,
      numberResults: 1,
      outputFormat: "PNG",
    },
  ]);

  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${RUNWARE_BASE}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RUNWARE_API_KEY}`,
      },
      body,
    });

    if (!res.ok) {
      const txt = await res.text();
      if (attempt < retries && res.status >= 500) {
        console.warn(`  runware ${res.status} on attempt ${attempt}, retrying…`);
        await sleep(2000 * attempt);
        continue;
      }
      throw new Error(`Runware ${res.status}: ${txt.slice(0, 200)}`);
    }

    const json = await res.json();
    const item = json.data?.[0];
    if (!item?.imageURL) throw new Error(`No imageURL in response: ${JSON.stringify(json).slice(0, 200)}`);
    return item.imageURL;
  }
}

// ── Prompt fetcher ────────────────────────────────────────────────────────────

async function fetchPrompts() {
  const url = "https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv";
  const res = await fetch(url);
  const csv = await res.text();

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
      else if (c === "\r") { /* skip */ } else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }

  return rows.slice(1).map(([act]) => act).filter(Boolean).slice(0, LIMIT);
}

// ── Image prompt engineering ──────────────────────────────────────────────────

function imagePrompt(act) {
  return (
    `editorial hero illustration for an AI prompt titled "${act}". ` +
    `Flat minimalist design, dark background, subtle geometric shapes, ` +
    `single vibrant accent color, cinematic composition, no text, no letters, ` +
    `professional digital art, 1024x1024`
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Fetching top ${LIMIT} prompts…`);
  const prompts = await fetchPrompts();
  console.log(`Got ${prompts.length} prompts. Generating images…\n`);

  let generated = 0, skipped = 0, failed = 0;

  for (let i = 0; i < prompts.length; i++) {
    const act = prompts[i];
    const key = `${S3_PREFIX}/${slug(act)}.png`;
    const label = `[${String(i + 1).padStart(3, "0")}/${prompts.length}] ${act.slice(0, 50)}`;

    if (SKIP_EXISTING && (await s3Exists(key))) {
      console.log(`  ${label} — skipped (exists)`);
      skipped++;
      continue;
    }

    try {
      process.stdout.write(`  ${label} — generating…`);
      const imageUrl = await runwareGenerate(imagePrompt(act));
      const buf = await downloadBuffer(imageUrl);
      await s3.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buf,
        ContentType: "image/png",
        CacheControl: "public, max-age=31536000, immutable",
      }));
      console.log(` ✓ → s3://${S3_BUCKET}/${key}`);
      generated++;
      // Polite rate-limiting: ~1.5 req/s
      await sleep(700);
    } catch (err) {
      console.error(` ✗ ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. generated=${generated} skipped=${skipped} failed=${failed}`);
  console.log(`Public URL prefix: https://com27.s3.${S3_REGION}.amazonaws.com/${S3_PREFIX}/`);
}

main().catch((err) => { console.error(err); process.exit(1); });
