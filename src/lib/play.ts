import { funnyThings } from "@/lib/funny";
import { listScrollerPacks } from "@/lib/scroller";

/** A smart card: one item from a scroller pack. */
export type KBit = {
  kind: "kbit";
  id: string;
  pack: string;
  packName: string;
  title: string;
  content: string;
  hook?: string;
  image?: string;
  tags: string[];
  rank?: number;
  sources: { title: string; url: string }[];
  cta?: { label: string; url: string };
};

/** A funny card from the Funny 100. */
export type FBit = {
  kind: "fbit";
  id: string;
  title: string;
  content: string;
  emoji: string;
  category: string;
  setup: string;
  turn: string;
  punchline: string;
};

export type DuelPack = { slug: string; name: string; ids: string[] };

export type PlayDeck = {
  kbits: KBit[];
  fbits: FBit[];
  /** Packs whose items carry a rank, so two of them can be duelled. */
  duelPacks: DuelPack[];
};

type LooseItem = {
  id: string;
  title: string;
  content: string;
  hook?: string;
  image?: string;
  tags?: string[];
  rank?: unknown;
  sources?: unknown;
  cta?: { label?: string; url?: string };
};

function sourcesOf(raw: unknown): { title: string; url: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is { title: string; url: string } =>
      Boolean(s && typeof s === "object" && typeof (s as { url?: unknown }).url === "string"),
    )
    .map((s) => ({ title: String(s.title || s.url), url: s.url }))
    .slice(0, 4);
}

function sample<T>(list: T[], n: number): T[] {
  if (list.length <= n) return list;
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

/**
 * maxPerPack keeps the page light: each request gets a fresh random slice of
 * every unranked pack. Ranked packs stay whole so any duel link resolves.
 */
export async function buildPlayDeck({ maxPerPack = Infinity }: { maxPerPack?: number } = {}): Promise<PlayDeck> {
  const packs = await listScrollerPacks();
  const kbits: KBit[] = [];
  const duelPacks: DuelPack[] = [];

  for (const pack of packs) {
    const ranked: string[] = [];
    const all = pack.items as LooseItem[];
    const isRanked = all.some((i) => typeof i.rank === "number");
    for (const raw of isRanked ? all : sample(all, maxPerPack)) {
      const rank = typeof raw.rank === "number" ? raw.rank : undefined;
      if (rank !== undefined) ranked.push(raw.id);
      kbits.push({
        kind: "kbit",
        id: `${pack.manifest.slug}~${raw.id}`,
        pack: pack.manifest.slug,
        packName: pack.manifest.name,
        title: raw.title,
        content: raw.content,
        hook: raw.hook,
        image: raw.image,
        tags: (raw.tags ?? []).slice(0, 4),
        rank,
        sources: sourcesOf(raw.sources),
        cta: raw.cta?.url && raw.cta.label ? { label: raw.cta.label, url: raw.cta.url } : undefined,
      });
    }
    if (ranked.length >= 10) {
      duelPacks.push({ slug: pack.manifest.slug, name: pack.manifest.name, ids: ranked });
    }
  }

  const fbits: FBit[] = funnyThings.map((f) => ({
    kind: "fbit",
    id: `funny~${f.rank}`,
    title: f.title,
    content: f.copy,
    emoji: f.emoji,
    category: f.category,
    setup: f.setup,
    turn: f.turn,
    punchline: f.punchline,
  }));

  return { kbits, fbits, duelPacks };
}
