import { getStars } from "@/lib/fetchers";
import SourceHero from "@/components/SourceHero";
import GithubClient from "./GithubClient";

export const revalidate = 1800;

export const metadata = {
  title: "GitHub Stars",
  description: "Repositories starred by @flexappdev, grouped by language.",
};

export default async function GithubPage() {
  const { stars, truncated } = await getStars();

  return (
    <div className="space-y-8 p-8">
      <SourceHero
        source="github"
        accent="#a78bfa"
        label="Scroller · GitHub Stars"
        title="GitHub Stars"
        subtitle={`Repos starred by @flexappdev, fetched via the public GitHub REST API and grouped by language.${truncated ? " · rate-limited, list may be partial" : ""}`}
        rightChip={`${stars.length} repos`}
      />
      <GithubClient stars={stars} />
    </div>
  );
}
