import type { Metadata } from "next";
import Image from "next/image";
import FunnyClient from "./FunnyClient";
import { funnyCategories, funnyThings } from "@/lib/funny";

export const metadata: Metadata = {
  title: "Top 100 Funniest Things Ever",
  description: "One hundred tiny masterpieces of chaos, shown as copy, editorial diagrams, images and short-video concepts.",
  alternates: { canonical: "/funny" },
  openGraph: { images: [{ url: "/funny/hero.png", width: 1536, height: 919, alt: "An editorial stage filled with everyday comedy" }] },
};

export default function FunnyPage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Top 100 Funniest Things Ever",
    numberOfItems: funnyThings.length,
    itemListElement: funnyThings.map((item) => ({ "@type": "ListItem", position: item.rank, name: item.title, description: item.copy })),
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <header className="relative min-h-[420px] overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
        <Image src="/funny/hero.png" alt="Everyday comic characters on a theatre stage" fill priority sizes="(max-width: 768px) 100vw, 1200px" className="object-cover object-[68%_center] opacity-75" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-transparent" />
        <div className="relative z-10 flex min-h-[420px] max-w-2xl flex-col justify-end p-5 md:p-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400 md:text-xs md:tracking-[0.24em]">Scroller original · editorial top 100</p>
          <h1 className="mt-4 text-balance text-4xl font-black tracking-[-0.04em] sm:text-5xl md:text-7xl" style={{ color: "#fff" }}>The 100 funniest things ever.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 sm:text-base sm:leading-7 md:mt-5 md:text-lg" style={{ color: "#d4d4d8" }}>An entirely subjective, suspiciously specific ranking of the tiny disasters that make being alive worthwhile—available as copy, diagrams, images and 24-second video concepts.</p>
        </div>
      </header>
      <section className="mt-8" aria-label="Top 100 funny things browser">
        <FunnyClient items={funnyThings} categories={funnyCategories} />
      </section>
    </main>
  );
}
