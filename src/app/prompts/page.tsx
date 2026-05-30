import { getPrompts } from "@/lib/fetchers";
import PromptsClient from "./PromptsClient";

export const revalidate = 3600;

export const metadata = {
  title: "Top 100 AI Prompts",
  description: "Curated from f/awesome-chatgpt-prompts. Click any card to copy.",
};

export default async function PromptsPage() {
  const { prompts, source } = await getPrompts();

  return (
    <div className="space-y-8 p-8">
      <header className="rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--app-accent)" }} />
          Scroller · Prompts
        </div>
        <h1 className="mt-3 text-4xl font-bold text-zinc-100">Top 100 AI Prompts</h1>
        <p className="mt-2 text-zinc-400">
          Curated from{" "}
          <a className="underline" href={source} target="_blank" rel="noreferrer">
            f/awesome-chatgpt-prompts
          </a>
          . Click any card to copy.
        </p>
      </header>

      <PromptsClient prompts={prompts} />
    </div>
  );
}
