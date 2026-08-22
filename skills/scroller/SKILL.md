---
name: scroller
description: Research, rank, script, render, and quality-check daily batches of up to 100 vertical 24-second Scroller videos about current top content. Use for Scroller Top 100, daily shorts, ranked TikToks, trending GitHub repositories, top podcasts, popular Wikipedia articles, AI context for personal or business audiences, render manifests, or short-video batch production.
---

# Scroller

Create a dated batch of separate 9:16 shorts: one ranked item per 24-second video. Default to 100 videos split evenly across TikTok, GitHub, podcasts, Wikipedia, and AI context when enough trustworthy items exist.

## Commands

- scroller daily [--count N]: research, rank, script, render, and QA today's batch.
- scroller plan [--count N]: research and write the manifest without paid generation or rendering.
- scroller source <tiktok|github|podcasts|wiki|ai> [--count N]: build one source category.
- scroller render <manifest.json>: resume rendering an approved manifest.
- scroller status [date]: report planned, rendered, failed, and publish-ready counts.

Interpret “Top 100 video” as 100 individual shorts unless the user explicitly requests one countdown video.

## Daily workflow

1. Resolve the date in the user's timezone and create ~/BO/videoai/2026/scroller/YYYY-MM-DD/ with manifest.json, sources.json, videos/, thumbnails/, and batch.log.
2. Read references/sources.md. Research current candidates from primary or attributable sources. Record retrieval time, source URL, ranking window, metric, and evidence.
3. Normalize and deduplicate candidates. Prefer canonical URLs. Do not reuse the same story, repository, show, article, or AI announcement across categories.
4. Rank within each category. Use published chart order when available. Otherwise label the result editorial_rank and score: source authority 35%, freshness 25%, measurable traction 25%, usefulness 15%.
5. Write candidate JSON and run scripts/build_manifest.py. Read references/manifest.md for the input and output contract.
6. Improve hooks and narration in manifest.json where deterministic fallback copy is weak. Keep factual claims traceable to evidence.
7. Render one sample first. Inspect captions, pronunciation, pacing, safe areas, source attribution, and duration. If sound, render sequentially or with low concurrency; do not stack heavy render processes.
8. Validate every output with ffprobe. Require 23.8–24.2 seconds, 1080×1920, H.264 video, AAC audio, readable burned-in captions, and no clipping.
9. Write results to batch.log as JSONL with planned, rendering, rendered, failed, or approved status. Resume existing successful files instead of regenerating them.
10. Report totals and failures. Never upload or publish without explicit permission.

## Editorial format

Use this fixed 24-second structure:

| Time | Purpose |
|---|---|
| 0–2s | Pattern-breaking hook |
| 2–5s | Rank, source, and title |
| 5–16s | What it is and why it is rising |
| 16–21s | Practical takeaway for the viewer |
| 21–24s | Source attribution and “Follow Scroller for tomorrow's Top 100” |

Target 48–58 spoken words. Use short sentences, active voice, and one idea per shot. Never invent engagement figures, quotes, chart positions, or product capabilities.

## Visual and audio contract

- Render 1080×1920 at 30 fps; H.264 + AAC; exactly 24 seconds.
- Keep essential text inside the central 80% width and away from the top 140 px and bottom 320 px.
- Show the rank continuously, the source during the first five seconds, and a small canonical-domain attribution at the end.
- Use 3–5 visual beats, kinetic captions, restrained Scroller emerald #10b981, high contrast, and no unlicensed watermark removal.
- Prefer licensed or source-provided imagery, permitted screenshots, generated editorial visuals, or branded motion cards.
- Use one consistent narrator per batch. Normalize loudness and keep music beneath narration.

## Source mix

For --count 100, target 20 items per category. Redistribute a shortfall only to categories with credible, non-duplicate candidates. A smaller honest batch is better than padding to 100.

Split AI context into a balanced mix of personal productivity, business operations, development, creative work, safety or policy, and notable models or tools. Label sponsored or affiliate content.

## Rendering integration

Reuse an existing Remotion, FFmpeg, and TTS pipeline when available. In Mat's ecosystem, inspect ~/BO/videoai/plugins/ before creating another renderer; the VAD wiki short pipeline is the closest existing composition. Keep deterministic timing, captions, file naming, resume state, and ffprobe QA in code. Use models for research synthesis, hooks, narration, visual prompts, and editorial judgement.

If no renderer is available, stop after a valid manifest and identify the missing renderer or credential. Do not claim MP4s were created.

## Safety and cost controls

- Treat daily rankings as temporally unstable; browse or query live sources every run.
- Do not bypass login walls, CAPTCHAs, robots restrictions, or platform terms.
- Do not expose credentials or place secrets in manifests or logs.
- Reuse cached assets and completed outputs.
- Perform the one-video sample before a large paid batch, while continuing automatically when the user already authorized generation and configured credentials are available.

## Completion criteria

A full daily run is complete only when the manifest is sourced and dated, every successful MP4 passes technical QA, failures are logged with retryable causes, counts are reported by category, and publish-ready files remain local until upload is explicitly authorized.
