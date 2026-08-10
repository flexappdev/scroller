import type { Dirent } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";

export type ScrollerCtaType = "lead" | "product" | "affiliate" | "sponsor";

export type ScrollerItem = {
  id: string;
  title: string;
  content: string;
  hook?: string;
  explanation?: string;
  tags?: string[];
  image?: string;
  video?: string;
  cta?: {
    type: ScrollerCtaType;
    label: string;
    url: string;
  };
};

export type ScrollerManifest = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  theme?: "light" | "dark";
  monetization?: {
    type: ScrollerCtaType;
    gateAfter?: number;
    ctaLabel: string;
    ctaUrl: string;
    offer?: string;
  };
};

export type ScrollerPack = {
  manifest: ScrollerManifest;
  items: ScrollerItem[];
};

const SCROLLERS_ROOT = path.join(process.cwd(), "data", "scrollers");
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid Scroller Pack: ${field} must be a non-empty string.`);
  }
}

function validateManifest(value: unknown): ScrollerManifest {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid Scroller Pack: manifest must be an object.");
  }

  const manifest = value as Partial<ScrollerManifest>;
  assertNonEmptyString(manifest.slug, "manifest.slug");
  assertNonEmptyString(manifest.name, "manifest.name");
  assertNonEmptyString(manifest.tagline, "manifest.tagline");
  assertNonEmptyString(manifest.description, "manifest.description");

  if (!SLUG_PATTERN.test(manifest.slug)) {
    throw new Error("Invalid Scroller Pack: manifest.slug must be kebab-case.");
  }

  if (manifest.monetization) {
    assertNonEmptyString(manifest.monetization.ctaLabel, "manifest.monetization.ctaLabel");
    assertNonEmptyString(manifest.monetization.ctaUrl, "manifest.monetization.ctaUrl");
    if (
      manifest.monetization.gateAfter !== undefined &&
      (!Number.isInteger(manifest.monetization.gateAfter) || manifest.monetization.gateAfter < 1)
    ) {
      throw new Error("Invalid Scroller Pack: gateAfter must be a positive integer.");
    }
  }

  return manifest as ScrollerManifest;
}

function validateItems(value: unknown): ScrollerItem[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Invalid Scroller Pack: items.json must contain at least one item.");
  }

  const seenIds = new Set<string>();
  return value.map((raw, index) => {
    if (!raw || typeof raw !== "object") {
      throw new Error(`Invalid Scroller Pack: item ${index + 1} must be an object.`);
    }

    const item = raw as Partial<ScrollerItem>;
    assertNonEmptyString(item.id, `items[${index}].id`);
    assertNonEmptyString(item.title, `items[${index}].title`);
    assertNonEmptyString(item.content, `items[${index}].content`);

    if (seenIds.has(item.id)) {
      throw new Error(`Invalid Scroller Pack: duplicate item id ${item.id}.`);
    }
    seenIds.add(item.id);

    return item as ScrollerItem;
  });
}

export async function getScrollerPack(slug: string): Promise<ScrollerPack | null> {
  if (!SLUG_PATTERN.test(slug)) return null;

  const packRoot = path.join(SCROLLERS_ROOT, slug);
  try {
    const [manifestSource, itemsSource] = await Promise.all([
      fs.readFile(path.join(packRoot, "manifest.json"), "utf8"),
      fs.readFile(path.join(packRoot, "items.json"), "utf8"),
    ]);

    const manifest = validateManifest(JSON.parse(manifestSource));
    const items = validateItems(JSON.parse(itemsSource));

    if (manifest.slug !== slug) {
      throw new Error(`Invalid Scroller Pack: folder ${slug} does not match manifest slug ${manifest.slug}.`);
    }

    return { manifest, items };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function listScrollerPacks(): Promise<ScrollerPack[]> {
  let entries: Dirent[];
  try {
    entries = await fs.readdir(SCROLLERS_ROOT, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const packs = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => getScrollerPack(entry.name)),
  );

  return packs.filter((pack): pack is ScrollerPack => Boolean(pack));
}
