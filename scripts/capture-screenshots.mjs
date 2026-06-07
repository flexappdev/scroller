// Capture screenshots of every fleet site via thum.io and upload to
// s3://com27/scroller/screenshots/<id>.png. Idempotent — overwrites.

import fs from "node:fs";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const envText = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const env = (k) => envText.match(new RegExp("^" + k + "=(.*)", "m"))?.[1] || "";

const s3 = new S3Client({
  region: "eu-west-2",
  credentials: {
    accessKeyId: env("S3_ACCESS_KEY"),
    secretAccessKey: env("S3_SECRET_ACCESS_KEY"),
  },
});

// Targets — id → live URL. Mirrors src/lib/scroll/fleet-urls.ts.
const TARGETS = {
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
  worldcupai: "https://worldcupai.app",
  wikai: "https://wikai.vercel.app",
};

// thum.io endpoint — `width/<px>` + `viewportWidth/<px>` for desktop screenshot.
// Free tier returns a watermark; the hosted PNG is the simplest no-deps capture.
function thumio(url) {
  return `https://image.thum.io/get/width/1280/viewportWidth/1366/png/${url}`;
}

async function downloadPng(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error(`response too small (${buf.length}B)`);
  return buf;
}

async function alreadyExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: "com27", Key: key }));
    return true;
  } catch (e) {
    if ((e?.name || e?.Code) === "NotFound" || e?.$metadata?.httpStatusCode === 404) return false;
    throw e;
  }
}

async function uploadPng(key, body) {
  await s3.send(new PutObjectCommand({
    Bucket: "com27",
    Key: key,
    Body: body,
    ContentType: "image/png",
    CacheControl: "public, max-age=86400",
  }));
}

const force = process.argv.includes("--force");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const onlyIds = onlyArg ? onlyArg.slice(7).split(",") : null;

const results = { ok: [], skip: [], fail: [] };

for (const [id, url] of Object.entries(TARGETS)) {
  if (onlyIds && !onlyIds.includes(id)) continue;
  const key = `scroller/screenshots/${id}.png`;
  try {
    if (!force && await alreadyExists(key)) {
      console.log(`SKIP ${id} (exists)`);
      results.skip.push(id);
      continue;
    }
    process.stdout.write(`CAPTURE ${id} ${url} ... `);
    const buf = await downloadPng(thumio(url));
    await uploadPng(key, buf);
    console.log(`OK ${buf.length}B → s3://com27/${key}`);
    results.ok.push(id);
  } catch (e) {
    console.log(`FAIL: ${e.message}`);
    results.fail.push({ id, message: e.message });
  }
  // gentle pace
  await new Promise((r) => setTimeout(r, 800));
}

console.log("\n--- DONE ---");
console.log("ok:", results.ok.length, results.ok.join(", "));
console.log("skip:", results.skip.length, results.skip.join(", "));
console.log("fail:", results.fail.length, results.fail.map((f) => `${f.id}(${f.message})`).join(", "));
