import type { ScrollerPack } from "@/lib/scroller";

export const POM_MINUTES = 24;
export const POMS_PER_DAY = 60;
export const SCENE_SECONDS = 20;
export const SCENES_PER_POM = 72;
export const BROADCAST_RESET_HOUR = 5;

export type ChannelId = "scroller" | "wikai" | "mediai";

export type ChannelProfile = {
  id: ChannelId;
  name: string;
  domain: string;
  accent: string;
  tagline: string;
};

const CHANNELS: Record<ChannelId, ChannelProfile> = {
  scroller: {
    id: "scroller",
    name: "Scroller",
    domain: "scroller.tv",
    accent: "#ec4899",
    tagline: "Mixed discovery. Controlled serendipity.",
  },
  wikai: {
    id: "wikai",
    name: "WikAI",
    domain: "wikai.tv",
    accent: "#22d3ee",
    tagline: "Knowledge you can scroll or watch.",
  },
  mediai: {
    id: "mediai",
    name: "MediaAI",
    domain: "mediai.tv",
    accent: "#f59e0b",
    tagline: "Generated and curated media, continuously programmed.",
  },
};

function isChannelId(value?: string | null): value is ChannelId {
  return value === "scroller" || value === "wikai" || value === "mediai";
}

export function resolveChannelProfile(host?: string | null, override?: string | null): ChannelProfile {
  if (isChannelId(override)) return CHANNELS[override];
  const normalized = (host ?? "").toLowerCase().split(":")[0];
  if (normalized === "wikai.tv" || normalized.endsWith(".wikai.tv")) return CHANNELS.wikai;
  if (normalized === "mediai.tv" || normalized.endsWith(".mediai.tv")) return CHANNELS.mediai;
  return CHANNELS.scroller;
}

export type RuntimeItem = {
  id: string;
  title: string;
  content: string;
  hook?: string;
  explanation?: string;
  tags: string[];
  packSlug: string;
  packName: string;
  href: string;
  image?: string;
  video?: string;
  cta?: { label: string; url: string };
};

function isWikiLike(item: RuntimeItem) {
  const haystack = `${item.packSlug} ${item.packName} ${item.tags.join(" ")} ${item.title}`.toLowerCase();
  return /(wiki|knowledge|history|science|geography|people|place|travel|world|learn|explain)/.test(haystack);
}

export function buildRuntimeItems(packs: ScrollerPack[], profile: ChannelProfile): RuntimeItem[] {
  const all = packs.flatMap(({ manifest, items }) =>
    items.map((item) => ({
      id: `${manifest.slug}:${item.id}`,
      title: item.title,
      content: item.content,
      hook: item.hook,
      explanation: item.explanation,
      tags: item.tags ?? [],
      packSlug: manifest.slug,
      packName: manifest.name,
      href: `/scroller/${manifest.slug}`,
      image: item.image,
      video: item.video,
      cta: item.cta ? { label: item.cta.label, url: item.cta.url } : undefined,
    })),
  );

  if (profile.id === "mediai") {
    const media = all.filter((item) => Boolean(item.video || item.image));
    return media.length ? media : all;
  }

  if (profile.id === "wikai") {
    const knowledge = all.filter(isWikiLike);
    return knowledge.length >= 10 ? knowledge : all;
  }

  return all;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function localDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function broadcastStartForDate(date: Date) {
  const start = new Date(date);
  start.setHours(BROADCAST_RESET_HOUR, 0, 0, 0);
  return start;
}

export function currentBroadcastStart(now: Date) {
  const start = broadcastStartForDate(now);
  if (now.getTime() < start.getTime()) start.setDate(start.getDate() - 1);
  return start;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function offsetFor(items: RuntimeItem[], channel: ChannelProfile, start: Date) {
  if (!items.length) return 0;
  return hashString(`${channel.id}:${localDateKey(start)}`) % items.length;
}

export type LivePosition = {
  broadcastStart: Date;
  pomIndex: number;
  sceneIndex: number;
  secondsIntoScene: number;
  secondsIntoPom: number;
  pomProgress: number;
};

export function getLivePosition(now: Date): LivePosition {
  const broadcastStart = currentBroadcastStart(now);
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - broadcastStart.getTime()) / 1000));
  const secondsPerPom = POM_MINUTES * 60;
  const secondsIntoDay = elapsedSeconds % 86_400;
  const pomIndex = Math.min(POMS_PER_DAY - 1, Math.floor(secondsIntoDay / secondsPerPom));
  const secondsIntoPom = secondsIntoDay % secondsPerPom;
  const sceneIndex = Math.min(SCENES_PER_POM - 1, Math.floor(secondsIntoPom / SCENE_SECONDS));
  return {
    broadcastStart,
    pomIndex,
    sceneIndex,
    secondsIntoScene: secondsIntoPom % SCENE_SECONDS,
    secondsIntoPom,
    pomProgress: secondsIntoPom / secondsPerPom,
  };
}

export function itemForSlot(
  items: RuntimeItem[],
  channel: ChannelProfile,
  broadcastStart: Date,
  pomIndex: number,
  sceneIndex: number,
) {
  if (!items.length) return undefined;
  const index =
    (offsetFor(items, channel, broadcastStart) + pomIndex * SCENES_PER_POM + sceneIndex) % items.length;
  return items[index];
}

export type PomScheduleEntry = {
  pom: number;
  start: Date;
  end: Date;
  anchor: RuntimeItem;
};

export function buildPomSchedule(items: RuntimeItem[], channel: ChannelProfile, calendarDate: Date) {
  if (!items.length) return [] as PomScheduleEntry[];
  const start = broadcastStartForDate(calendarDate);
  return Array.from({ length: POMS_PER_DAY }, (_, pomIndex) => {
    const pomStart = new Date(start.getTime() + pomIndex * POM_MINUTES * 60_000);
    return {
      pom: pomIndex + 1,
      start: pomStart,
      end: new Date(pomStart.getTime() + POM_MINUTES * 60_000),
      anchor: itemForSlot(items, channel, start, pomIndex, 0)!,
    };
  });
}

export function formatClock(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatBroadcastDate(date: Date) {
  return date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
