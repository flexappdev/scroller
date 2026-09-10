import { getStars } from "@/lib/fetchers";
import MediaiFeed from "@/components/MediaiFeed";
import { cardToMediai } from "@/lib/scroll/toMediai";

export const revalidate = 1800;

export const metadata = {
  title: "GitHub Stars · Scroller",
  description: "Fullscreen GitHub stars feed.",
};

export default async function GithubPage() {
  const { stars } = await getStars();
  const initial = {
    items: stars.map((s) => cardToMediai({
      kind: "star", full_name: s.full_name, description: s.description, html_url: s.html_url, stars: s.stargazers_count, language: s.language,
    })),
    nextOffset: null,
  };
  return <MediaiFeed initial={initial} />;
}
