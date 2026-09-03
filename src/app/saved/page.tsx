import Link from "next/link";

export default function SavedPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8 pb-28 sm:px-8">
      <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>Saved</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Your keep pile.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6" style={{ color: "var(--foreground-muted)" }}>
        Saved items and personal collections belong here. The route is now part of the universal Scroller navigation contract so every consuming site has the same destination.
      </p>
      <Link href="/" className="mt-7 inline-flex rounded-xl px-4 py-3 text-sm font-black text-black" style={{ background: "var(--accent)" }}>
        Back to Home
      </Link>
    </main>
  );
}
