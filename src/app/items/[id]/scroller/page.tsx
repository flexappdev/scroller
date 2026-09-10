import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { resolveDetail } from "@/lib/item-detail";
import ItemActionsClient from "../ItemActionsClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await resolveDetail(id);
  if (!detail) return { title: "Item not found" };
  return { title: `${detail.title} · Scroller` };
}

export default async function ItemScrollerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await resolveDetail(id);
  if (!detail) notFound();

  return (
    <main className="fixed inset-0 z-20 h-[100dvh] w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain bg-black text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <section className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden bg-zinc-950">
        {detail.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={detail.image} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.55)_0%,rgba(0,0,0,.05)_36%,rgba(0,0,0,.3)_58%,rgba(0,0,0,.95)_100%)]" />

        <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
          <Link href={`/items/${id}`} className="inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-3 py-1.5 text-xs text-white/85 hover:text-white transition-colors border border-white/20">
            <ArrowLeft className="h-3 w-3" />
            Details page
          </Link>
        </div>

        <div className="absolute right-3 z-20 flex flex-col gap-4" style={{ top: "calc(56px + env(safe-area-inset-top))" }}>
          <ItemActionsClient id={`item:${id}`} />
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 z-10 flex flex-col justify-end pr-[78px]"
          style={{
            bottom: "calc(28px + env(safe-area-inset-bottom))",
            paddingLeft: 18,
            paddingBottom: 12,
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-white/90 backdrop-blur">{detail.subtitle}</span>
          </div>
          <h1 className="scroller-display line-clamp-3 max-w-5xl text-[clamp(1.5rem,6.5vw,3.25rem)] font-black uppercase leading-[0.95] tracking-[-0.055em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,.75)]">
            {detail.title}
          </h1>
          {detail.description && (
            <p className="mt-3 max-w-3xl text-sm md:text-base text-white/85 line-clamp-6 [text-shadow:0_1px_6px_rgba(0,0,0,.7)]">{detail.description}</p>
          )}
          {detail.url && (
            <div className="pointer-events-auto mt-4">
              <a
                href={detail.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-emerald-400/50 bg-emerald-950/60 backdrop-blur-md px-4 py-2.5 text-sm text-emerald-100 hover:border-emerald-300 hover:text-white transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                {detail.urlLabel ?? "Open external"}
              </a>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
