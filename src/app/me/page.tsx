import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function MePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8 pb-28 sm:px-8">
      <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>Me</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Scroller settings.</h1>

      <Link
        href="/live"
        className="mt-7 block rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:bg-[var(--surface-hover)]"
        style={{ borderColor: "var(--accent)", background: "var(--surface-soft)" }}
      >
        <div className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>Private</div>
        <div className="mt-2 text-xl font-black">Scroller Live</div>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--foreground-muted)" }}>
          Live health, stats and tasks for scroller.tv, wikai.tv and mediai.tv. Sign-in required.
        </p>
      </Link>

      <section className="mt-4 flex items-center justify-between rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>
        <div>
          <h2 className="font-black">Appearance</h2>
          <p className="mt-1 text-xs" style={{ color: "var(--foreground-muted)" }}>Dark is the default. Toggle light mode here.</p>
        </div>
        <ThemeToggle />
      </section>
      <section className="mt-4 rounded-2xl border p-5 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>
        <div className="font-black">Universal navigation</div>
        <p className="mt-2 leading-6" style={{ color: "var(--foreground-muted)" }}>Home · Explore · Gen · Saved · Me is the shared navigation contract for Scroller and future MS Core consumers.</p>
      </section>
    </main>
  );
}
