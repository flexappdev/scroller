import { getPrompts } from "@/lib/fetchers";
import MediaiFeed from "@/components/MediaiFeed";
import { cardToMediai } from "@/lib/scroll/toMediai";

export const revalidate = 3600;

export const metadata = {
  title: "Prompts · Scroller",
  description: "Fullscreen prompt feed.",
};

export default async function PromptsPage() {
  const { prompts } = await getPrompts();
  const initial = {
    items: prompts.map((p) => cardToMediai({ kind: "prompt", ...p })),
    nextOffset: null,
  };
  return <MediaiFeed initial={initial} />;
}
