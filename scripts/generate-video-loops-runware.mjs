// Generate short ambient video loops via the Runware Seedance model
// (bytedance:2@2). One 5-second 720p mp4 per source, uploaded to
// s3://com27/scroller/video-loops/<source>.mp4 — used as hero backgrounds
// on /about and per-source landing pages.
//
// Note: there is no /viadi skill — this script is the substitute. The default
// model in the central env is already Seedance, but this script hard-pins
// `bytedance:2@2` explicitly to avoid accidental fallbacks. See memory
// `feedback_runware_default_model_is_video` for context.
//
// Usage:
//   node scripts/generate-video-loops-runware.mjs [--limit=N] [--skip-existing]
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
const S3_PREFIX = "scroller/video-loops";
const S3_REGION = "eu-west-2";

const s3 = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: ENV.S3_ACCESS_KEY,
    secretAccessKey: ENV.S3_SECRET_ACCESS_KEY,
  },
});

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;
const SKIP_EXISTING = args.includes("--skip-existing");

// ── Source prompts ────────────────────────────────────────────────────────────

const SOURCES = [
  { id: "scroller",   prompt: "abstract vertical content streams flowing into a single feed, dark zinc background, emerald accent, cinematic minimalist motion graphic" },
  { id: "wiki",       prompt: "encyclopedic library pages slowly turning, soft warm light, minimalist editorial motion, dark background" },
  { id: "wikivoyage", prompt: "world map pulsing with travel markers, soft blue glow, calm minimalist motion graphic, dark background" },
  { id: "amazon",     prompt: "subtle product cards floating in a dark void, warm amber accent, smooth cinematic motion, minimalist" },
  { id: "videos",     prompt: "abstract play button pulsing softly with red gradient waves, minimalist editorial motion, dark background" },
  { id: "github",     prompt: "code constellation slowly forming into a star, purple accent on dark zinc, ambient editorial motion" },
  { id: "prompts",    prompt: "thought bubbles morphing into typography shapes, warm amber light on dark background, minimalist motion" },
  { id: "sites",      prompt: "browser windows folding into a single panel, soft emerald glow, minimalist editorial motion" },
  { id: "apps",       prompt: "app icons rotating in a slow grid, cyan accent on dark zinc, ambient editorial motion graphic" },
  { id: "images",     prompt: "photographs scattering and reassembling into a grid, cyan glow, minimalist cinematic motion" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve, reject);
      }
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
  } catch { return false; }
}

// ── Runware Seedance video API ────────────────────────────────────────────────

async function runwarePost(payload) {
  const res = await fetch("https://api.runware.ai/v1/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RUNWARE_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Runware ${res.status}: ${txt.slice(0, 300)}`);
  }
  return res.json();
}

async function runwareGenerateVideo(prompt) {
  const taskUUID = crypto.randomUUID();
  // Submit — Seedance 864x480 is the supported 16:9 size at this model
  await runwarePost([
    {
      taskType: "videoInference",
      taskUUID,
      positivePrompt: prompt,
      model: "bytedance:2@2",   // Seedance — hard-pin (see feedback memory)
      width: 864,
      height: 480,
      duration: 5,
      numberResults: 1,
      outputFormat: "MP4",
      outputType: "URL",
    },
  ]);

  // Poll — videoInference is async; status flips processing → success
  for (let attempt = 0; attempt < 60; attempt++) {
    await sleep(5000);
    const json = await runwarePost([{ taskType: "getResponse", taskUUID }]);
    const item = json.data?.[0];
    if (!item) continue;
    if (item.errors?.length) throw new Error(`Runware error: ${JSON.stringify(item.errors).slice(0, 200)}`);
    if (item.status === "success" && item.videoURL) return item.videoURL;
    if (item.status === "failed") throw new Error(`Task failed: ${JSON.stringify(item).slice(0, 200)}`);
    // else still processing
  }
  throw new Error("timeout after 5 minutes");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const targets = SOURCES.slice(0, Math.min(LIMIT, SOURCES.length));
  console.log(`Generating ${targets.length} video loops (Seedance bytedance:2@2)…\n`);

  let generated = 0, skipped = 0, failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const { id, prompt } = targets[i];
    const key = `${S3_PREFIX}/${id}.mp4`;
    const label = `[${String(i + 1).padStart(2, "0")}/${targets.length}] ${id}`;

    if (SKIP_EXISTING && (await s3Exists(key))) {
      console.log(`  ${label} — skipped (exists)`);
      skipped++;
      continue;
    }

    try {
      process.stdout.write(`  ${label} — generating (5s 720p)…`);
      const videoUrl = await runwareGenerateVideo(prompt);
      const buf = await downloadBuffer(videoUrl);
      await s3.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buf,
        ContentType: "video/mp4",
        CacheControl: "public, max-age=31536000, immutable",
      }));
      console.log(` ✓ ${(buf.length / 1024 / 1024).toFixed(2)}MB → s3://${S3_BUCKET}/${key}`);
      generated++;
      await sleep(1000);
    } catch (err) {
      console.error(` ✗ ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. generated=${generated} skipped=${skipped} failed=${failed}`);
  console.log(`Public URL prefix: https://com27.s3.${S3_REGION}.amazonaws.com/${S3_PREFIX}/`);
}

main().catch((err) => { console.error(err); process.exit(1); });
