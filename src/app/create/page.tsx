import Link from "next/link";

const stages = ["Page", "List", "Images", "Audio", "Video"];

export default function CreatePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8 pb-28 sm:px-8">
      <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>
        ScrollAI · Gen
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Any topic → Top 100.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6" style={{ color: "var(--foreground-muted)" }}>
        ScrollAI is the control plane for building a reusable Scroller Pack. Give it a topic; it researches, ranks, enriches, validates and publishes through the shared engine.
      </p>

      <section className="mt-8 rounded-2xl border p-5 sm:p-6" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>
        <h2 className="text-sm font-black uppercase tracking-[0.16em]">Build order</h2>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {stages.map((stage, index) => (
            <div key={stage} className="rounded-xl border px-2 py-3 text-center" style={{ borderColor: "var(--border)" }}>
              <div className="text-[10px] font-mono" style={{ color: "var(--foreground-muted)" }}>{String(index + 1).padStart(2, "0")}</div>
              <div className="mt-1 text-xs font-bold sm:text-sm">{stage}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border p-5 sm:p-6" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>
        <h2 className="text-sm font-black uppercase tracking-[0.16em]">Command</h2>
        <code className="mt-4 block overflow-x-auto rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
          /scrollai &lt;topic&gt;
        </code>
        <p className="mt-3 text-xs leading-5" style={{ color: "var(--foreground-muted)" }}>
          Example: /scrollai Top 100 AI Context 2026. Use build, refresh, enrich, embed and status for explicit control.
        </p>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/scroller/ai-context-2026" className="rounded-xl px-4 py-3 text-sm font-black text-black" style={{ background: "var(--accent)" }}>
          Open AI Context 2026
        </Link>
        <Link href="/browse" className="rounded-xl border px-4 py-3 text-sm font-bold" style={{ borderColor: "var(--border)" }}>
          Explore sources
        </Link>
      </div>
    </main>
  );
}
