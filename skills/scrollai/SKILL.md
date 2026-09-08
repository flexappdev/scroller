---
name: scrollai
description: Universal control plane for researching, ranking, enriching and publishing any topic as a reusable Top 100 Scroller Pack. Use for /scrollai, Top 100 scrollers, topic-to-scroller generation, refreshes, media enrichment, site embedding and Scroller fleet management.
---

# ScrollAI

ScrollAI turns **any topic** into one validated Scroller Pack consumed by the shared Scroller runtime. It manages scrollers; it does not create a new application per topic.

## Core command

```text
/scrollai <topic>
```

Default behavior: research the topic live, create or refresh a ranked Top 100, validate it, and publish it through the existing Scroller engine when the current environment has deployment access.

## Commands

```text
/scrollai <topic>
/scrollai plan <topic>
/scrollai build <topic> [--count 100] [--stage page|list|images|audio|video|all]
/scrollai enrich <slug> --stage images|audio|video
/scrollai refresh <slug>
/scrollai embed <slug> --site <site-id>
/scrollai status [slug]
```

## Non-negotiable architecture

1. One engine: reuse `/scroller/[slug]` and the shared Scroller feed.
2. One pack per topic: `data/scrollers/<slug>/`.
3. One per-site configuration contract; never fork the Scroller UI for a new site.
4. The shared engine can be consumed by MS Core sites, MS Lists, WikiAI, LawAI, ArtAI and other ABC apps.
5. Keep content portable and provider-neutral. MediaAI/VaultAI own assets; Scroller owns presentation and interaction.

## Build order

Always build in this exact order:

**Page → List → Images → Audio → Video**

A later media stage must never block an earlier useful stage.

### 1. Page

Create `page.md` plus the pack manifest. Define audience, scope, date/window, taxonomy, ranking method and sources. For current topics, browse live sources before writing.

### 2. List

Create `items.json`. Default to exactly 100 useful, non-duplicate ranked items when the evidence supports 100. Each item needs `id`, `title`, `content`; add rank/category/tags/hooks when useful. Prefer clarity and coverage over padding.

### 3. Images

Reuse valid VaultAI/MediaAI assets first. Generate only gaps. Keep one canonical image reference per item. Store asset references rather than embedding binaries in the pack.

### 4. Audio

Generate concise narration/TTS only after the list is stable. Audio is optional enrichment, never required for the text scroller to ship. Reuse the configured MediaAI voice pipeline.

### 5. Video

Generate video last. Prefer the currently best-value configured renderer. As of the 2026-09-03 reference build, LTX-2.5 is the preferred promotional route and Runware is the fallback; this is configuration, not architecture. Render one sample and QA it before a paid batch.

## Research and ranking

For time-sensitive topics:

- resolve the user timezone/date first;
- use live primary sources where possible;
- record the snapshot date;
- separate durable concepts from current releases;
- rank editorially by impact, current relevance, breadth of use and explanatory value;
- never invent metrics, releases or positions;
- refresh rather than silently mutating historical snapshots.

For a Top 100 context pack, aim for a balanced taxonomy rather than 100 near-duplicate product names.

## Universal UI contract

Scroller should feel familiar to users of TikTok, Instagram and YouTube without copying their branding.

- Accent: `#ec4899` pink by default.
- Theme: dark by default; light toggle available.
- Header: sticky.
- Mobile footer: sticky five destinations in this order:
  1. Home
  2. Explore
  3. Gen
  4. Saved
  5. Me
- `Gen` is the emphasized center action and opens `/create`.
- Desktop may add a rail, but the same five destinations and routes remain canonical.
- Feed uses vertical scroll snap and direct item deep links.

Canonical routes:

```text
/           Home
/explore    Explore
/create     Gen / ScrollAI control entry
/saved      Saved
/me         Me / settings
/scroller/<slug>  A topic pack
```

## Pack contract

Minimum:

```text
data/scrollers/<slug>/
  manifest.json
  page.md
  items.json
```

The manifest should include the snapshot date, theme, accent and stage state when available. Unknown optional fields must remain backward-compatible with the existing runtime.

## Validation and publish gate

Before publishing:

```bash
npm run scroller:validate
npm run build
```

Definition of done:

- manifest parses;
- item ids are unique;
- requested item count is met or a shortfall is explicitly justified;
- route builds;
- first card renders;
- vertical scroll snap works;
- sticky header/footer render;
- five nav routes do not 404;
- no secrets or private VaultAI assets are exposed to the public client.

For data-only pack changes on a known-good shared runtime, a successful validation/build may publish directly to the configured production branch. Treat shared runtime code changes more cautiously and verify before merging.

## Scheduled refreshes

Recurring packs may define a refresh cadence, but preserve dated snapshots where the historical state matters. On each refresh:

1. research new facts;
2. diff against the prior list;
3. rerank only when evidence warrants it;
4. preserve existing media for unchanged items;
5. queue media only for new or materially changed items;
6. validate and publish;
7. report additions, removals, rank moves and media gaps.

## Cost rule

Spend money only after Page + List are valid. Reuse assets before generation. Sample-test video before bulk generation. Promotions can change providers; they must not change the pack schema or Scroller engine.


## Commercial 1G

ScrollAI also owns the commercial loop for Scroller.

**Goal:** reach and sustain **$100/day gross revenue** from useful Scroller experiences.

This is a KPI, not a guarantee.

```
gross_revenue_usd = adsense_revenue_usd + amazon_affiliate_revenue_usd
net_revenue_usd   = gross_revenue_usd - generation_cost_usd - hosting_cost_usd
```

Unknown revenue stays unknown. Never convert missing telemetry to zero.

### Orchestration boundary

- **Scroller** — presentation, navigation, monetisation and interaction telemetry.
- **WIKAI** — Wikipedia/Wikivoyage research, structured articles, canonical entities and attribution.
- **MediaAI** — article-first image/audio/motion/video enrichment, favouring local generation and reuse.
- **ABC** — revenue/cost/profit reporting, portfolio comparison and progress to the daily target.

### Monetisation rules

1. Preserve the configured Amazon Associates tag on every eligible Amazon URL.
2. Load AdSense only when `NEXT_PUBLIC_ADSENSE_CLIENT` is configured.
3. Keep ads away from primary swipe/navigation controls and never encourage ad clicks.
4. Affiliate relationships must remain clearly disclosed.
5. For personalised ads to EEA/UK/Switzerland traffic, configure a Google-certified TCF CMP first.
6. Rank items primarily for usefulness; never create thin pages solely to manufacture ad inventory.

### Revenue ladder

| Stage | Gross/day | ScrollAI behaviour |
|---|---:|---|
| Proof | $1 | verify attribution and reporting |
| Signal | $10 | identify repeatable topics/channels |
| Scale | $30 | expand winning lists and media |
| 1G | $100 | optimise traffic × RPM × affiliate conversion |

### Measure

Track by day, list and item:

- sessions and scroll depth;
- item/detail opens;
- media plays;
- Amazon outbound clicks and attributed revenue;
- AdSense revenue;
- generation and hosting cost;
- gross and net revenue.

Scale proven winners **Top 100 → 1K → 10K** while keeping the same pack/item schema.
