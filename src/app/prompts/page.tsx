import { getPrompts } from "@/lib/fetchers";
import SourceHero from "@/components/SourceHero";
import PromptsClient from "./PromptsClient";

export const revalidate = 3600;

export const metadata = {
  title: "Top 100 AI Prompts",
  description: "Curated from f/awesome-chatgpt-prompts. Click any card to copy.",
};

export default async function PromptsPage() {
  const { prompts } = await getPrompts();

  return (
    <div className="space-y-8 p-8">
      <SourceHero
        source="prompts"
        accent="#f59e0b"
        label="Scroller · Prompts"
        title="Top 100 AI Prompts"
        subtitle="Curated from f/awesome-chatgpt-prompts on GitHub. Click any card to copy the prompt. Each hero is a FLUX-generated illustration."
        rightChip={`${prompts.length} prompts`}
      />
      <PromptsClient prompts={prompts} />
    </div>
  );
}
