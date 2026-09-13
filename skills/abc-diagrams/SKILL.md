---
name: abc-diagrams
description: Create and maintain clear, implementation-grade ABC architecture diagrams for specs, backlogs, README files and system documentation. Use for /abc-diagrams, architecture maps, control/data planes, agent graphs, runtime flows, deployment gates, monetisation loops and rebuild-from-spec diagrams.
---

# ABC Diagrams

Turn product thinking into diagrams that an engineer or agent can implement without guessing.

## Core rule

**One diagram = one question.**

A diagram is not decoration. It must explain ownership, data movement, runtime behaviour, a decision gate, or a measurable feedback loop.

## Default style

Use Mermaid in Markdown as the canonical editable source.

- Dark editorial mental model; keep the syntax portable to GitHub Mermaid.
- Strong hierarchy: Human → orchestration → control plane → engine → adapters/data → channels → users/money.
- Use short node labels plus a second line for responsibility when useful.
- Prefer left-to-right for pipelines and top-to-bottom for system/context diagrams.
- Use subgraphs for planes/bounded contexts.
- Keep shared runtime visibly separate from per-channel configuration.
- Show sources of truth explicitly.
- Label irreversible/expensive gates such as generation, deploy, payment and publish.
- Show feedback arrows for analytics, revenue and human editorial judgement.
- Never imply a component exists/live unless it is implemented or clearly marked target/WIP.

## ABC colour semantics

When custom Mermaid classes are useful:

```text
#006699  ABC / orchestration / control
#ec4899  product / Scroller / human interaction
#10b981  data / verified / live path
#f59e0b  gate / warning / WIP
#ef4444  blocked / failed / unsafe
#0a0a0a  editorial dark background reference for rendered SVG variants
```

Do not depend on colour alone; labels must carry meaning.

## Required diagram set for a master collection spec

For a collection such as `MSSCROLL`, maintain these diagrams:

1. **System context** — human, ABC, collection agent, users and external systems.
2. **One engine → N channels** — what is shared vs configured.
3. **Rebuild from spec** — spec + manifest + data/assets + engine → reproducible channel.
4. **Runtime request flow** — domain resolution → manifest → adapters → feed/player.
5. **Canonical data graph** — stable IDs and relationships.
6. **Content factory** — ingest → normalize → article/list → media → QA → publish.
7. **Ranking/feed loop** — candidates → eligibility → score → diversity → feed → events → rerank.
8. **Scroll ↔ TV state model** — same item identity across modes.
9. **TV scheduling** — programming unit, slots, catalogue and playback.
10. **ABC agent orchestration** — who owns what and where evidence returns.
11. **Money/1G loop** — traffic → monetisation → revenue/cost → profitability → priorities.
12. **Deployment circuit breaker** — data-only change vs shared-code change.
13. **Migration** — current codebases → adapters → parity gate → duplicated runtime retirement.
14. **Spec/backlog sync** — human decision → spec → backlog → code/test/live evidence → sheet.

Add sequence/state diagrams when timing or lifecycle behaviour is ambiguous.

## Source-of-truth convention

Every diagram collection must name the authoritative artefacts.

For MS Scroll:

```text
AI26 Google Sheet = human/portfolio source of truth
MSSCROLL           = collection spec ID
MSS-*              = backlog IDs
flexappdev/scroller = shared runtime implementation mirror
channel manifest    = per-domain executable configuration
canonical item ID   = content identity across Scroll/TV/metrics/money
```

## Detail levels

Use three levels instead of one giant unreadable graph:

- **L0 — Executive:** 5–12 nodes; explains the whole system in 30 seconds.
- **L1 — Architecture:** 10–30 nodes; planes, adapters, services and boundaries.
- **L2 — Engineering:** route/event/schema/state/deployment detail suitable for implementation.

A master diagram doc should begin with L0, then descend into L1/L2.

## Diagram quality gate

Before committing:

- Can a new engineer identify the source of truth?
- Is shared code distinguishable from per-channel config/data?
- Are current vs target components not misleading?
- Are write paths and feedback loops visible?
- Are costly actions behind gates?
- Are stable IDs visible where systems join?
- Does each arrow have a meaningful direction?
- Can the diagram be reconciled with the backlog/spec?
- Are names identical to the repo/sheet terminology?
- Is there a link from README/spec/backlog to the diagram atlas?

## MS Scroll canonical usage

Primary diagram atlas:

`docs/MS-SCROLL-ABC-DIAGRAMS.md`

Master spec:

`docs/MS-SCROLL-MASTER-SPEC.md`

Backlog:

`docs/MS-SCROLL-BACKLOG.md`

Legacy/portfolio architecture:

`docs/SCROLLAI-ULTIMATE-DIAGRAM.md`

When MS Scroll architecture changes, update the atlas in the same change as the affected spec/backlog documentation.
