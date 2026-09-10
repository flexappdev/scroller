"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import type { LiveDashboardSnapshot, LiveSiteSnapshot, LiveTask } from "@/lib/live-dashboard";

function relativeTime(value: string | null): string {
  if (!value) return "Unknown";
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff)) return "Unknown";
  const mins = Math.max(0, Math.floor(diff / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function stateClasses(state: string): string {
  if (state === "live" || state === "done" || state === "ok") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (state === "wip" || state === "degraded") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (state === "offline") return "border-red-500/30 bg-red-500/10 text-red-300";
  return "border-white/10 bg-white/[0.04] text-white/55";
}

function TaskRow({ task }: { task: LiveTask }) {
  const content = (
    <div className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3">
      <span className={`mt-0.5 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.13em] ${stateClasses(task.status)}`}>
        {task.status}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold leading-5 text-white/90">{task.title}</div>
        <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
          {task.priority} · {task.source}
        </div>
      </div>
      {task.url ? <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-white/35" /> : null}
    </div>
  );

  return task.url ? (
    <a href={task.url} target="_blank" rel="noreferrer" className="block transition hover:-translate-y-px">
      {content}
    </a>
  ) : content;
}

function SiteCard({ site }: { site: LiveSiteSnapshot }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-pink-400">{site.role}</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight">{site.name}</h2>
          <a href={site.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-white/45 hover:text-white/75">
            {site.domain} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${stateClasses(site.target.state)}`}>
          {site.target.state}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {site.metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-white/8 bg-black/20 p-3">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">{metric.label}</div>
            <div className="mt-1 text-sm font-black text-white/90">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-white/8 bg-black/20 p-4 text-xs sm:grid-cols-2">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.15em] text-white/35">Fallback</div>
          <a href={site.fallbackUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate text-white/75 hover:text-white">
            {site.fallbackUrl.replace("https://", "")}
          </a>
          <div className="mt-1 text-white/40">{site.fallback.state}{site.fallback.httpStatus ? ` · ${site.fallback.httpStatus}` : ""}</div>
        </div>
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.15em] text-white/35">Latest repo activity</div>
          <a href={`https://github.com/${site.repo}`} target="_blank" rel="noreferrer" className="mt-1 block truncate text-white/75 hover:text-white">
            {site.repo}
          </a>
          <div className="mt-1 line-clamp-1 text-white/40">
            {site.repoStats.latestCommitMessage ?? "Repo stats unavailable"}
          </div>
          <div className="mt-1 text-white/30">{relativeTime(site.repoStats.latestCommitAt ?? site.repoStats.pushedAt)}</div>
        </div>
      </div>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-xs font-black uppercase tracking-[0.16em]">Tasks</h3>
          <span className="text-[10px] text-white/35">GitHub issues + rollout backlog</span>
        </div>
        <div className="space-y-2">
          {site.tasks.length ? site.tasks.map((task) => <TaskRow key={`${site.id}-${task.id}`} task={task} />) : (
            <div className="rounded-xl border border-white/8 p-4 text-sm text-white/40">No tasks found.</div>
          )}
        </div>
      </section>
    </article>
  );
}

export default function LiveDashboardClient({ initial }: { initial: LiveDashboardSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/live", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setSnapshot((await response.json()) as LiveDashboardSnapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const updated = useMemo(
    () => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(snapshot.generatedAt)),
    [snapshot.generatedAt],
  );

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Flagships live" value={`${snapshot.summary.liveFlagships} / ${snapshot.summary.totalFlagships}`} />
        <Stat label="Open tasks" value={String(snapshot.summary.openTasks)} />
        <Stat label="Scroller packs" value={String(snapshot.summary.scrollerPacks)} />
        <Stat label="Scroller cards" value={snapshot.summary.scrollerCards.toLocaleString("en-GB")} />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3">
        <div className="text-xs text-white/45">
          Live health refreshes every 60s · repo data caches for 5m · last refresh {updated}
          {error ? <span className="ml-2 text-red-300">· {error}</span> : null}
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/80 transition hover:bg-white/[0.08] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh now
        </button>
      </div>

      <section className="grid gap-5 xl:grid-cols-3">
        {snapshot.sites.map((site) => <SiteCard key={site.id} site={site} />)}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="text-[9px] font-black uppercase tracking-[0.17em] text-white/35">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight text-white">{value}</div>
    </div>
  );
}
