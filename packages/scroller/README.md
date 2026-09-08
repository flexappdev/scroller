# @fleet/scroller

Shared shell for the fleet scroller feed. Consumers: `scroller` (self),
`wikai`, `yb100`, `xmas`, `fs`, `sp`.

Tracks PBI-S-1..S-8 in
`~/.claude/plans/staus-of-all-apps-groovy-turing.md`.

## Current state (2026-09-02)

- S-1 workspace root: ✅ `pnpm-workspace.yaml` at repo root
- S-2 `ContentItem`: ✅ `src/types/ContentItem.ts` (universal 12-kind union)
- S-3 `SiteConfig`: ✅ `src/config.ts` (brand + nav + monetisation flags)
- S-4 Feed / Card / Chrome extraction: 🟫 not started
- S-5 wikai reference port: 🟫 not started
- S-6 yb100 port: 🟫 not started
- S-7 xmas + fs ports: 🟫 not started
- S-8 sp port + fleet spine hardening: 🟫 not started

## Adopting in a consumer app

1. Add to app `package.json` deps: `"@fleet/scroller": "workspace:*"`.
2. Create `site.config.ts` in the app implementing `SiteConfig`.
3. Import feed primitives from `@fleet/scroller` (available after S-4).
