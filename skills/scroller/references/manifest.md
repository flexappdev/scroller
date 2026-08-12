# Manifest contract

## Candidate input

Pass a JSON array or an object with an items array to scripts/build_manifest.py.

Required: source, title, URL, and summary.

Recommended: rank, metric, evidence, retrieved_at, ranking_type, image_url, audience, hook, takeaway, and visual_prompt.

Valid source aliases normalize to tiktok, github, podcasts, wiki, or ai.

Example item:

    {
      "source": "github",
      "title": "owner/repository",
      "url": "https://github.com/owner/repository",
      "summary": "What it does and why it is gaining attention.",
      "rank": 1,
      "metric": "1,240 stars gained this week",
      "evidence": "GitHub Trending, weekly, Python",
      "retrieved_at": "2026-08-12T09:00:00+01:00",
      "ranking_type": "published_chart",
      "audience": "business"
    }

## Build command

    python3 scripts/build_manifest.py --input candidates.json --output manifest.json --date YYYY-MM-DD --count 100

The builder deduplicates canonical URLs and titles, applies the default per-source quota, assigns batch ranks and stable IDs, creates fallback narration and a timed shot plan, and writes a render contract. It does not perform research or fabricate missing chart evidence.

## Render outputs

Name MP4s <batch-rank>-<source>-<source-rank>-<slug>.mp4. A renderer may add provider-specific state, but must preserve the manifest item ID and source evidence.

Each JSONL log line should contain timestamp, item_id, status, file, and duration. Use failed with a concise error and keep processing the remaining batch. A rerun skips approved files and retries only incomplete or failed items unless --overwrite is explicit.
