import { getStars } from "@/lib/fetchers";
import GithubClient from "./GithubClient";

export const revalidate = 1800;

export default async function GithubPage() {
  const { stars, truncated } = await getStars();

  return (
    <div className="space-y-8 p-8">
      <header className="rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--app-accent)" }} />
          Scroller · GitHub Stars
        </div>
        <h1 className="mt-3 text-4xl font-bold text-zinc-100">GitHub Stars</h1>
        <p className="mt-2 text-zinc-400">
          {stars.length} repos starred by{" "}
          <a className="underline" href="https://github.com/flexappdev?tab=stars" target="_blank" rel="noreferrer">
            @flexappdev
          </a>
          {truncated && <span className="ml-2 text-amber-400">· rate-limited, list may be partial</span>}
        </p>
      </header>

      <GithubClient stars={stars} />
    </div>
  );
}
