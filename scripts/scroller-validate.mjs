import { promises as fs } from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "data", "scrollers");
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function requiredString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
}

async function validatePack(slug) {
  const dir = path.join(root, slug);
  const [manifestRaw, itemsRaw] = await Promise.all([
    fs.readFile(path.join(dir, "manifest.json"), "utf8"),
    fs.readFile(path.join(dir, "items.json"), "utf8"),
  ]);

  const manifest = JSON.parse(manifestRaw);
  const items = JSON.parse(itemsRaw);

  requiredString(manifest.slug, `${slug}: manifest.slug`);
  requiredString(manifest.name, `${slug}: manifest.name`);
  requiredString(manifest.tagline, `${slug}: manifest.tagline`);
  requiredString(manifest.description, `${slug}: manifest.description`);

  if (!slugPattern.test(manifest.slug) || manifest.slug !== slug) {
    throw new Error(`${slug}: folder name and kebab-case manifest.slug must match`);
  }

  if (!Array.isArray(items) || items.length < 1) {
    throw new Error(`${slug}: items.json must contain at least one item`);
  }

  const ids = new Set();
  for (const [index, item] of items.entries()) {
    requiredString(item.id, `${slug}: items[${index}].id`);
    requiredString(item.title, `${slug}: items[${index}].title`);
    requiredString(item.content, `${slug}: items[${index}].content`);
    if (ids.has(item.id)) throw new Error(`${slug}: duplicate item id ${item.id}`);
    ids.add(item.id);
  }

  if (manifest.monetization) {
    requiredString(manifest.monetization.ctaLabel, `${slug}: monetization.ctaLabel`);
    requiredString(manifest.monetization.ctaUrl, `${slug}: monetization.ctaUrl`);
    if (
      manifest.monetization.gateAfter !== undefined &&
      (!Number.isInteger(manifest.monetization.gateAfter) || manifest.monetization.gateAfter < 1)
    ) {
      throw new Error(`${slug}: monetization.gateAfter must be a positive integer`);
    }
  }

  console.log(`✓ ${slug}: ${items.length} items`);
}

let entries = [];
try {
  entries = await fs.readdir(root, { withFileTypes: true });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const slugs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
if (slugs.length === 0) throw new Error("No Scroller Packs found in data/scrollers");

for (const slug of slugs) await validatePack(slug);
console.log(`Validated ${slugs.length} Scroller Pack(s).`);
