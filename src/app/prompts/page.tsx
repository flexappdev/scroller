import { getPrompts } from "@/lib/fetchers";
import PromptCard from "./PromptCard";

export const revalidate = 3600;

export default async function PromptsPage() {
  const { prompts, source } = await getPrompts();

  return (
    <div className="space-y-8 p-8">
      <header className="rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--app-accent)" }} />
          FAD · Prompts
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

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {prompts.map((p, i) => (
          <PromptCard key={`${p.act}-${i}`} index={i + 1} act={p.act} prompt={p.prompt} />
        ))}
      </section>
    </div>
  );
}
