# Scroller — Status

_Last updated: 2026-05-24_

## Latest

- **Repo**: [flexappdev/scroller](https://github.com/flexappdev/scroller) · port `19013` · accent `#10b981`
- **Branch**: `main` even with `origin/main`
- **Local UAT**: http://localhost:19013/
- **Recent commits**:
  - `2ad305a` bump next to ^15.5.18 (CVE-2025-66478)
  - `a027f47` chore: archive 2022 codebase under `2022/` + scaffold Next.js 15 v2 app
  - `04805d4` init: Scroller — FAD scroller engine
- **Data sources** (`src/lib/fetchers.ts`):
  - YouTube RSS @mat-siems-production — ISR 600s
  - GitHub stars @flexappdev (paginated, optional `GITHUB_TOKEN`) — ISR 1800s
  - `f/awesome-chatgpt-prompts` CSV → top 100 — ISR 3600s
  - bundled snapshot at `data/apps-registry.json` (static import in `getApps()`)
- **Routes**: `/`, `/about`, `/apps`, `/videos`, `/github`, `/prompts`, plus a duplicate `/scroller` page byte-identical to `/`
- **`2022/`**: preserved legacy codebase, not imported anywhere live — safe cold storage
- **Caveat**: `getApps()` reads the bundled registry snapshot at `~/APPS/scroller/data/apps-registry.json` — re-sync from cockpit + redeploy when the cockpit registry changes

## Next steps

Ordered by blast radius — smallest first.

1. **Promote in registry** — `~/APPS/apps-registry.json` entry for `scroller` is missing `github` and `role: site` (every other site has both). Add them. _Belongs in `appai`, not here._
2. **Consolidate `/` and `/scroller`** — both render the same component. Pick one canonical route and redirect or delete the other.
3. **Drop the `2022/` archive** — keep as cold-storage or delete to slim the repo. Last touched in `a027f47`; not referenced.
4. **Fix prod registry read** — replace the `os.homedir()` `fs.readFile` in `getApps()` with either (a) bundled JSON import at build time, or (b) `fetch()` to a cockpit-hosted endpoint. Required before Vercel deploys `/apps` correctly.
5. **Set the GitHub homepage URL** — repo currently has none; once deployed, set it via `gh repo edit flexappdev/scroller --homepage <url>` so the prod link is discoverable.
6. **Consider merge with `~/APPS/scrollerai`** — same vertical-snap UI metaphor, different content (scrollerai = gamified knowledge cards, port `24001`, accent `#ff2d8d`). Could become one repo with two modes, or stay separate.

## Prod link

**TBD** — not yet deployed.

- `flexappdev/scroller` has no `homepageUrl` set
- No `vercel.json` present, no Vercel CLI available locally to query
- No domain recorded in `~/APPS/REPOS.md` or `~/APPS/apps-registry.json`

Once deployed, update this section and run `gh repo edit flexappdev/scroller --homepage <url>` so it surfaces from the GitHub API.
