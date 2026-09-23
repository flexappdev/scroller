import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Top 100 Collections",
  description: "Explore Scroller's Top 100 visual collections and ranked lists.",
  alternates: { canonical: "/top100" },
};

const collections = [
  {
    href: "/top100/cinema",
    image: "/top100/cinema/images/001.webp",
    alt: "The Last Train, a rain soaked cinematic platform",
    label: "10 worlds · 100 original images",
    title: "Top 100 Cinematic Scenes",
    description: "Movies that never existed. Explore every scene in a perspective 3D gallery.",
  },
  {
    href: "/funny",
    image: "/funny/hero.png",
    alt: "An editorial stage filled with everyday comedy",
    label: "100 ranked ideas",
    title: "Top 100 Funniest Things Ever",
    description: "A subjective ranking of the tiny disasters that make being alive worthwhile.",
  },
];

export default function Top100Page() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-400">Scroller collections</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Top 100</h1>
        <p className="mt-3 max-w-2xl text-base text-zinc-400">Explore each list, one item at a time.</p>
      </header>
      <section className="grid gap-5 md:grid-cols-2" aria-label="Top 100 collections">
        {collections.map((collection) => (
          <Link key={collection.href} href={collection.href} className="group overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">
            <div className="relative aspect-video overflow-hidden">
              <Image src={collection.image} alt={collection.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
            <div className="p-5">
              <p className="text-sm uppercase tracking-wider text-amber-400">{collection.label}</p>
              <h2 className="mt-2 text-2xl font-semibold">{collection.title}</h2>
              <p className="mt-2 text-base text-zinc-400">{collection.description}</p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
