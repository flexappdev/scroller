import { getApps, getPrompts, getStars, getVideos } from "@/lib/fetchers";
import ScrollerFeed from "@/components/ScrollerFeed";

export const dynamic = "force-dynamic";

function shuffle<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default async function ScrollerPage() {
  const [{ videos }, { stars }, { prompts }, { apps }] = await Promise.all([
    getVideos(),
    getStars(),
    getPrompts(),
    getApps(),
  ]);

  const cards: Array<
    | { kind: "video"; id: string; title: string; url: string; thumbnail: string; published: string }
    | { kind: "star"; full_name: string; description: string | null; html_url: string; stars: number; language: string | null }
    | { kind: "prompt"; act: string; prompt: string }
    | { kind: "app"; id: string; display_name: string; domain_name: string; subdomain: string; accent: string }
  > = [
    ...videos.slice(0, 15).map((v) => ({ kind: "video" as const, ...v })),
    ...stars.slice(0, 30).map((s) => ({
      kind: "star" as const,
      full_name: s.full_name,
      description: s.description,
      html_url: s.html_url,
      stars: s.stargazers_count,
      language: s.language,
    })),
    ...prompts.slice(0, 30).map((p) => ({ kind: "prompt" as const, ...p })),
    ...apps
      .filter((a) => !a.placeholder)
      .map((a) => ({
        kind: "app" as const,
        id: a.id,
        display_name: a.display_name,
        domain_name: a.domain_name,
        subdomain: a.subdomain,
        accent: a.accent,
      })),
  ];

  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const ordered = shuffle(cards, seed);

  return <ScrollerFeed cards={ordered} />;
}
