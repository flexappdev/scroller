import { ExternalLink } from "lucide-react";

// MSB-014 — a clearly labelled Amazon Associates card between feed items,
// matched to the topic of the item just scrolled past. Never counted as
// content: it carries no rank, save or share controls.
export function amazonSearchUrl(topic: string, tag: string, marketplace: string): string {
  const host = marketplace.replace(/^https?:\/\//, "").replace(/\/$/, "") || "www.amazon.co.uk";
  return `https://${host}/s?k=${encodeURIComponent(topic)}&tag=${encodeURIComponent(tag)}`;
}

export default function AmazonPickCard({
  topic,
  tag,
  marketplace,
  afterItem,
}: {
  topic: string;
  tag: string;
  marketplace: string;
  afterItem: number;
}) {
  return (
    <section
      className="relative flex min-h-[100dvh] w-full snap-start snap-always items-center justify-center bg-zinc-950 px-5 py-24 text-white"
      aria-label={`Amazon picks for ${topic}`}
      data-testid="amazon-pick-card"
      data-after-item={afterItem}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
          Sponsored · #CommissionsEarned
        </p>
        <h2 className="text-xl font-semibold leading-snug">Books and gear about {topic}</h2>
        <p className="mt-2 text-sm text-white/60">Hand-off to Amazon search for the topic you just scrolled past.</p>
        <a
          href={amazonSearchUrl(topic, tag, marketplace)}
          target="_blank"
          rel="sponsored nofollow noreferrer"
          data-affiliate="amazon"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-300"
        >
          Browse on Amazon <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
        <p className="mt-4 text-[11px] leading-relaxed text-white/40">
          As an Amazon Associate we earn from qualifying purchases.
        </p>
      </div>
    </section>
  );
}
