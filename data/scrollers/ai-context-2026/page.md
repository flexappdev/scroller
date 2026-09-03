# Top 100 AI Context 2026

**Snapshot:** 3 September 2026 · end of Q3, looking into Q4.

This ScrollAI pack is a compact mental model of the current AI landscape: frontier models, challenger/open models, major product platforms, agents, context and data, reasoning and evaluation, multimodal media, infrastructure, training/safety/governance, and the people/future questions shaping the market.

## Ten lenses

1. Frontier models
2. Open & challenger AI
3. Platforms & products
4. Agents & orchestration
5. Context & data
6. Reasoning & evaluation
7. Media & multimodal
8. Infrastructure & economics
9. Training, safety & governance
10. People & future

## Media pipeline

ScrollAI always builds in this order:

**Page → List → Images → Audio → Video**

This pack ships its **Page** and **List** first. Images, audio and video are explicit downstream enrichment stages so a missing renderer never blocks the Top 100 itself.

For video enrichment, prefer the currently economical LTX route when available, but keep the pack provider-neutral. The Scroller runtime must never depend on one media vendor.

## Design contract

- TikTok-style vertical scroll snap.
- Pink accent `#ec4899`.
- Dark mode by default; light mode available.
- Sticky header.
- Sticky five-button footer: **Home · Explore · Gen · Saved · Me**.
- One shared Scroller engine; never fork a new application for a new topic.
