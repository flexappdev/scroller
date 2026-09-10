import taskRegistry from "../../data/live-tasks.json";
import { listScrollerPacks } from "@/lib/scroller";

export type LiveSiteId = "scroller" | "wikai" | "mediai";
export type LiveHealthState = "live" | "degraded" | "offline" | "unverified";
export type LiveTaskStatus = "todo" | "wip" | "done";
export type LiveTaskPriority = "P0" | "P1" | "P2";

export type LiveTask = {
  id: string;
  title: string;
  status: LiveTaskStatus;
  priority: LiveTaskPriority;
  source: "bootstrap" | "github";
  url?: string;
};

export type LiveProbe = {
  state: LiveHealthState;
  httpStatus: number | null;
  latencyMs: number | null;
  checkedAt: string;
};

export type RepoStats = {
  state: "ok" | "unverified";
  latestCommitSha: string | null;
  latestCommitMessage: string | null;
  latestCommitAt: string | null;
  pushedAt: string | null;
  openWorkItems: number | null;
  defaultBranch: string | null;
};

export type LiveMetric = {
  label: string;
  value: string;
};

export type LiveSiteSnapshot = {
  id: LiveSiteId;
  name: string;
  role: string;
  domain: string;
  url: string;
  fallbackUrl: string;
  repo: string;
  target: LiveProbe;
  fallback: LiveProbe;
  repoStats: RepoStats;
  metrics: LiveMetric[];
  tasks: LiveTask[];
};

export type LiveDashboardSnapshot = {
  generatedAt: string;
  summary: {
    liveFlagships: number;
    totalFlagships: number;
    openTasks: number;
    scrollerPacks: number;
    scrollerCards: number;
  };
  sites: LiveSiteSnapshot[];
};

type BootstrapTask = {
  id: string;
  title: string;
  status: LiveTaskStatus;
  priority: LiveTaskPriority;
};

const BOOTSTRAP_TASKS = taskRegistry as Record<LiveSiteId, BootstrapTask[]>;

const SITES: Array<{
  id: LiveSiteId;
  name: string;
  role: string;
  domain: string;
  url: string;
  fallbackUrl: string;
  repo: string;
}> = [
  {
    id: "scroller",
    name: "Scroller TV",
    role: "Discovery + mixed-topic feed",
    domain: "scroller.tv",
    url: "https://scroller.tv",
    fallbackUrl: "https://scroller-psi.vercel.app",
    repo: "flexappdev/scroller",
  },
  {
    id: "wikai",
    name: "WIKAI TV",
    role: "Knowledge-first feed",
    domain: "wikai.tv",
    url: "https://wikai.tv",
    fallbackUrl: "https://wikai.matsiems.com",
    repo: "flexappdev/wikai",
  },
  {
    id: "mediai",
    name: "Mediai TV",
    role: "Media-first feed",
    domain: "mediai.tv",
    url: "https://mediai.tv",
    fallbackUrl: "https://mediai-public.vercel.app",
    repo: "flexappdev/mediai",
  },
];

const PROBE_TIMEOUT_MS = 6_000;
const GITHUB_REVALIDATE_SECONDS = 300;

async function probe(url: string): Promise<LiveProbe> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.status === 405) {
      response = await fetch(url, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
      });
    }

    const ok = response.status >= 200 && response.status < 400;
    return {
      state: ok ? "live" : "degraded",
      httpStatus: response.status,
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      state: "offline",
      httpStatus: null,
      latencyMs: null,
      checkedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN?.trim();
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "Scroller-Live",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function githubJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: githubHeaders(),
      next: { revalidate: GITHUB_REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

type GitHubRepo = {
  pushed_at?: string | null;
  open_issues_count?: number;
  default_branch?: string;
};

type GitHubCommit = {
  sha?: string;
  commit?: {
    message?: string;
    committer?: { date?: string | null };
    author?: { date?: string | null };
  };
};

type GitHubIssue = {
  number?: number;
  title?: string;
  html_url?: string;
  pull_request?: unknown;
  labels?: Array<{ name?: string | null }>;
};

function issuePriority(labels: string[]): LiveTaskPriority {
  const normalized = labels.map((label) => label.toLowerCase());
  if (normalized.some((label) => label === "p0" || label.includes("critical") || label.includes("urgent"))) return "P0";
  if (normalized.some((label) => label === "p2" || label.includes("low"))) return "P2";
  return "P1";
}

function issueStatus(labels: string[]): LiveTaskStatus {
  const normalized = labels.map((label) => label.toLowerCase());
  if (normalized.some((label) => label.includes("wip") || label.includes("in progress") || label.includes("doing"))) return "wip";
  return "todo";
}

async function repoSnapshot(repo: string): Promise<{ stats: RepoStats; tasks: LiveTask[] }> {
  const [repoInfo, commits, issues] = await Promise.all([
    githubJson<GitHubRepo>(`/repos/${repo}`),
    githubJson<GitHubCommit[]>(`/repos/${repo}/commits?per_page=1`),
    githubJson<GitHubIssue[]>(`/repos/${repo}/issues?state=open&per_page=8&sort=updated&direction=desc`),
  ]);

  const latest = commits?.[0] ?? null;
  const issueTasks = (issues ?? [])
    .filter((issue) => !issue.pull_request && issue.title)
    .map((issue): LiveTask => {
      const labels = (issue.labels ?? []).map((label) => label.name ?? "").filter(Boolean);
      return {
        id: `github-${issue.number ?? issue.title}`,
        title: issue.title ?? "Untitled GitHub task",
        status: issueStatus(labels),
        priority: issuePriority(labels),
        source: "github",
        url: issue.html_url,
      };
    });

  return {
    stats: {
      state: repoInfo ? "ok" : "unverified",
      latestCommitSha: latest?.sha?.slice(0, 8) ?? null,
      latestCommitMessage: latest?.commit?.message?.split("\n")[0] ?? null,
      latestCommitAt: latest?.commit?.committer?.date ?? latest?.commit?.author?.date ?? null,
      pushedAt: repoInfo?.pushed_at ?? null,
      openWorkItems: typeof repoInfo?.open_issues_count === "number" ? repoInfo.open_issues_count : null,
      defaultBranch: repoInfo?.default_branch ?? null,
    },
    tasks: issueTasks,
  };
}

function bootstrapTasks(site: LiveSiteId): LiveTask[] {
  return BOOTSTRAP_TASKS[site].map((task) => ({ ...task, source: "bootstrap" }));
}

export async function getLiveDashboard(): Promise<LiveDashboardSnapshot> {
  const packs = await listScrollerPacks();
  const scrollerCards = packs.reduce((sum, pack) => sum + pack.items.length, 0);

  const sites = await Promise.all(
    SITES.map(async (site): Promise<LiveSiteSnapshot> => {
      const [target, fallback, repo] = await Promise.all([
        probe(site.url),
        probe(site.fallbackUrl),
        repoSnapshot(site.repo),
      ]);

      const tasks = [...repo.tasks, ...bootstrapTasks(site.id)].slice(0, 12);
      const openBootstrap = bootstrapTasks(site.id).filter((task) => task.status !== "done").length;

      const metrics: LiveMetric[] = [
        { label: "Target", value: target.state === "live" ? `LIVE · ${target.httpStatus}` : target.state.toUpperCase() },
        { label: "Latency", value: target.latencyMs == null ? "Unknown" : `${target.latencyMs} ms` },
        { label: "Repo", value: repo.stats.state === "ok" ? `${repo.stats.defaultBranch ?? "main"} · ${repo.stats.latestCommitSha ?? "n/a"}` : "Unverified" },
        { label: "Tasks", value: String(repo.tasks.length || openBootstrap) },
      ];

      if (site.id === "scroller") {
        metrics.push(
          { label: "Packs", value: String(packs.length) },
          { label: "Cards", value: scrollerCards.toLocaleString("en-GB") },
        );
      }

      return {
        ...site,
        target,
        fallback,
        repoStats: repo.stats,
        metrics,
        tasks,
      };
    }),
  );

  const openTasks = sites.reduce(
    (sum, site) => sum + site.tasks.filter((task) => task.status !== "done").length,
    0,
  );

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      liveFlagships: sites.filter((site) => site.target.state === "live").length,
      totalFlagships: sites.length,
      openTasks,
      scrollerPacks: packs.length,
      scrollerCards,
    },
    sites,
  };
}
