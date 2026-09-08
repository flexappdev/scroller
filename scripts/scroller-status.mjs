import { promises as fs } from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "data", "scrollers");
const defaultBases = [
  "https://scroller-psi.vercel.app",
  "https://scroller-bay.vercel.app",
];

const bases = (process.env.SCROLLER_LIVE_URLS || defaultBases.join(","))
  .split(",")
  .map((value) => value.trim().replace(/\/$/, ""))
  .filter(Boolean);

const timeoutMs = Math.max(1000, Number(process.env.SCROLLER_STATUS_TIMEOUT_MS || 8000));

async function readPacks() {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const packs = [];
  for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const dir = path.join(root, entry.name);
    try {
      const [manifestRaw, itemsRaw] = await Promise.all([
        fs.readFile(path.join(dir, "manifest.json"), "utf8"),
        fs.readFile(path.join(dir, "items.json"), "utf8"),
      ]);
      const manifest = JSON.parse(manifestRaw);
      const items = JSON.parse(itemsRaw);
      packs.push({
        slug: entry.name,
        name: manifest.name || entry.name,
        items: Array.isArray(items) ? items.length : 0,
        valid: manifest.slug === entry.name && Array.isArray(items) && items.length > 0,
      });
    } catch (error) {
      packs.push({
        slug: entry.name,
        name: entry.name,
        items: 0,
        valid: false,
        error: error instanceof Error ? error.message : "invalid pack",
      });
    }
  }
  return packs;
}

async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
    });
    if (response.status === 405) {
      response = await fetch(url, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
        headers: { Range: "bytes=0-0" },
      });
    }
    return {
      status: response.status,
      ok: response.status >= 200 && response.status < 400,
      ms: Date.now() - started,
    };
  } catch (error) {
    return {
      status: null,
      ok: false,
      ms: Date.now() - started,
      error: error instanceof Error ? error.message : "fetch failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

const packs = await readPacks();
const results = [];

for (const pack of packs) {
  const deployments = {};
  for (const base of bases) {
    const url = `${base}/scroller/${pack.slug}`;
    deployments[base] = { url, ...(await probe(url)) };
  }
  results.push({ ...pack, deployments });
}

const summary = {
  generatedAt: new Date().toISOString(),
  bases,
  packs: results,
  totals: {
    packs: results.length,
    locallyValid: results.filter((pack) => pack.valid).length,
    liveChecks: results.reduce(
      (sum, pack) => sum + Object.values(pack.deployments).filter((deployment) => deployment.ok).length,
      0,
    ),
  },
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`Scroller fleet status · ${summary.generatedAt}`);
  console.log("");
  for (const pack of results) {
    const states = bases.map((base) => {
      const deployment = pack.deployments[base];
      const label = new URL(base).hostname.replace(".vercel.app", "");
      return `${label}=${deployment.ok ? deployment.status : deployment.status ?? "ERR"}`;
    });
    console.log(
      `${pack.valid ? "✓" : "✗"} ${pack.slug} · ${pack.items} items · ${states.join(" · ")}`,
    );
  }
  console.log("");
  console.log(
    `${summary.totals.locallyValid}/${summary.totals.packs} locally valid · ${summary.totals.liveChecks} successful live checks`,
  );
}
