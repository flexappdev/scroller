import { promises as fs } from "node:fs";
import path from "node:path";

const [, , nameArg, itemsPathArg] = process.argv;

if (!nameArg) {
  console.error('Usage: npm run scroller:new -- "100 AI Agent Use Cases" [items.json]');
  process.exit(1);
}

const slug = nameArg
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

if (!slug) {
  console.error("Could not create a valid slug from the supplied name.");
  process.exit(1);
}

const target = path.join(process.cwd(), "data", "scrollers", slug);

try {
  await fs.access(target);
  console.error(`Scroller already exists: ${target}`);
  process.exit(1);
} catch {
  // Expected when creating a new pack.
}

let items = [
  {
    id: "001",
    title: nameArg,
    content: "Replace this starter card with generated content before publishing.",
  },
];

if (itemsPathArg) {
  const source = JSON.parse(await fs.readFile(path.resolve(itemsPathArg), "utf8"));
  if (!Array.isArray(source) || source.length === 0) {
    throw new Error("The supplied items file must be a non-empty JSON array.");
  }
  items = source;
}

const manifest = {
  slug,
  name: nameArg,
  tagline: `A fast Scroller guide to ${nameArg}.`,
  description: `${nameArg}, presented as a reusable vertical Scroller Pack.`,
  theme: "dark",
  monetization: {
    type: "lead",
    gateAfter: Math.min(20, Math.max(1, items.length)),
    ctaLabel: "Turn this into a working AI workflow",
    ctaUrl: process.env.SCROLLER_DEFAULT_CTA_URL || "https://www.matsiems.com/",
    offer: "Move from ideas to implementation",
  },
};

await fs.mkdir(target, { recursive: true });
await Promise.all([
  fs.writeFile(path.join(target, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
  fs.writeFile(path.join(target, "items.json"), `${JSON.stringify(items, null, 2)}\n`),
]);

console.log(`Created data/scrollers/${slug}`);
console.log(`Preview route: /scroller/${slug}`);
console.log("Run npm run scroller:validate before committing.");
