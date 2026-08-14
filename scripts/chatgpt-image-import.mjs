#!/usr/bin/env node

import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const input = process.argv[2];
if (!input) {
  console.error("Usage: npm run scroller:chatgpt-images -- /path/to/unpacked-chatgpt-export");
  process.exit(1);
}

const sourceRoot = path.resolve(input);
const publicRoot = path.join(process.cwd(), "public", "scroller", "chatgpt-images");
const packRoot = path.join(process.cwd(), "data", "scrollers", "chatgpt-images");
const imageExt = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (imageExt.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

function titleFromFile(file) {
  return path.basename(file, path.extname(file)).replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

async function loadConversationHints() {
  const file = path.join(sourceRoot, "conversations.json");
  try {
    const raw = JSON.parse(await readFile(file, "utf8"));
    const hints = [];
    for (const conversation of Array.isArray(raw) ? raw : []) {
      const title = conversation?.title || "ChatGPT conversation";
      const created = conversation?.create_time ? new Date(conversation.create_time * 1000).toISOString() : undefined;
      const mapping = conversation?.mapping || {};
      for (const node of Object.values(mapping)) {
        const message = node?.message;
        const parts = message?.content?.parts;
        if (!Array.isArray(parts)) continue;
        const text = parts.filter((part) => typeof part === "string").join(" ").trim();
        if (text) hints.push({ title, created, text: text.slice(0, 500) });
      }
    }
    return hints;
  } catch {
    return [];
  }
}

await mkdir(publicRoot, { recursive: true });
await mkdir(packRoot, { recursive: true });

const [files, hints] = await Promise.all([walk(sourceRoot), loadConversationHints()]);
const unique = new Map();
for (const file of files) {
  const info = await stat(file);
  const key = `${path.basename(file)}:${info.size}`;
  if (!unique.has(key)) unique.set(key, { file, info });
}

const sorted = [...unique.values()].sort((a, b) => a.info.mtimeMs - b.info.mtimeMs);
const items = [];
for (let index = 0; index < sorted.length; index += 1) {
  const { file, info } = sorted[index];
  const ext = path.extname(file).toLowerCase();
  const outputName = `${String(index + 1).padStart(5, "0")}${ext}`;
  await cp(file, path.join(publicRoot, outputName));
  const title = titleFromFile(file) || `ChatGPT image ${index + 1}`;
  const hint = hints.find((candidate) => candidate.text.toLowerCase().includes(title.toLowerCase().slice(0, 24)));
  items.push({
    id: String(index + 1).padStart(5, "0"),
    title: hint?.title || title,
    content: hint?.text || `Generated ChatGPT image from ${new Date(info.mtimeMs).toISOString().slice(0, 10)}.`,
    image: `/scroller/chatgpt-images/${outputName}`,
    hook: new Date(info.mtimeMs).toISOString(),
    tags: ["ChatGPT Image Archive"],
  });
}

const manifest = {
  slug: "chatgpt-images",
  name: "ChatGPT Image Archive",
  tagline: "Every generated image. One endless scroll.",
  description: "A chronological Scroller of generated images imported from a ChatGPT data export.",
  theme: "dark",
};

await writeFile(path.join(packRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(path.join(packRoot, "items.json"), `${JSON.stringify(items, null, 2)}\n`);
console.log(`Imported ${items.length} unique images into /scroller/chatgpt-images`);
