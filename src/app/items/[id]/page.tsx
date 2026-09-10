import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { resolveDetail } from "@/lib/item-detail";
import ItemActionsClient from "./ItemActionsClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await resolveDetail(id);
  if (!detail) return { title: "Item not found" };
  const description = (detail.description ?? `${detail.subtitle} — open in Scroller.`).slice(0, 160);
  return {
    title: detail.title,
    description,
    openGraph: {
      title: detail.title,
      description,
      type: "article" as const,
      ...(detail.image ? { images: [{ url: detail.image }] } : {}),
    },
    twitter: {
      card: detail.image ? ("summary_large_image" as const) : ("summary" as const),
      title: detail.title,
      description,
      ...(detail.image ? { images: [detail.image] } : {}),
    },
  };
}

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await resolveDetail(id);
  if (!detail) notFound();

  const decoded = decodeURIComponent(id);
  const kind = decoded.split(":")[0];
  const backHref =
    kind === "amazon" ? "/?source=amazon" :
    kind === "image" ? "/images" :
    kind === "site" ? "/sites" :
    kind === "wiki" || kind === "wikivoyage" ? `/?source=${kind}` :
    kind === "video" ? "/videos" :
    kind === "star" ? "/github" :
    kind === "prompt" ? "/prompts" :
    kind === "app" ? "/apps" :
    "/";

  return (
    <article className="relative min-h-[100svh] w-full overflow-hidden bg-black text-white">
      {detail.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={detail.image} alt={detail.title} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.55)_0%,rgba(0,0,0,.15)_40%,rgba(0,0,0,.9)_100%)]" />

      <div className="relative z-10 flex min-h-[100svh] flex-col justify-between p-6 md:p-10">
        <div className="flex items-center justify-between gap-4">
          <Link href={backHref} className="inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-3 py-1.5 text-xs text-white/85 hover:text-white transition-colors border border-white/20">
            <ArrowLeft className="h-3 w-3" />
            Back
          </Link>
          <ItemActionsClient id={`item:${id}`} scrollerHref={`/items/${id}/scroller`} />
        </div>

        <div className="max-w-3xl space-y-4" style={detail.accent ? { borderLeft: `3px solid ${detail.accent}`, paddingLeft: 14 } : undefined}>
          <div className="text-[10px] uppercase tracking-wider text-white/70 font-mono">{detail.subtitle}</div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight [text-shadow:0_2px_20px_rgba(0,0,0,.7)]">{detail.title}</h1>
          {detail.description && (
            <p className="text-sm md:text-base text-white/85 leading-relaxed whitespace-pre-line max-w-2xl [text-shadow:0_1px_6px_rgba(0,0,0,.6)]">{detail.description}</p>
          )}

          {detail.extra && detail.extra.length > 0 && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-white/15 bg-black/50 backdrop-blur-md p-4 max-w-2xl">
              {detail.extra.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-[10px] uppercase tracking-wider text-white/60 font-mono">{row.label}</dt>
                  <dd className="text-sm text-white/90 font-mono text-right break-all">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {detail.url && (
              <a
                href={detail.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-emerald-400/50 bg-emerald-950/60 backdrop-blur-md px-4 py-2.5 text-sm text-emerald-100 hover:border-emerald-300 hover:text-white transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                {detail.urlLabel ?? "Open external"}
              </a>
            )}
            <Link
              href={`/items/${id}/scroller`}
              className="inline-flex items-center gap-2 rounded-md border border-white/25 bg-black/50 backdrop-blur-md px-4 py-2.5 text-sm text-white hover:border-white/60 transition-colors"
            >
              Open in scroller
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
