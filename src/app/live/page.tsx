import LiveDashboardClient from "@/components/LiveDashboardClient";
import { getLiveDashboard } from "@/lib/live-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LivePage() {
  const initial = await getLiveDashboard();

  return (
    <main className="mx-auto w-full max-w-[1500px] px-5 py-8 pb-28 sm:px-8">
      <div className="mb-7">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-pink-400">Private · ScrollAI</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Scroller Live.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">
          One authenticated cockpit for scroller.tv, wikai.tv and mediai.tv: production health, repo activity, fleet stats and the current rollout tasks.
        </p>
      </div>

      <LiveDashboardClient initial={initial} />
    </main>
  );
}
