#!/usr/bin/env python3
"""Build a deterministic Scroller render manifest from researched candidates."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

SOURCE_ORDER = ("tiktok", "github", "podcasts", "wiki", "ai")
ALIASES = {
    "tiktok": "tiktok", "tik_tok": "tiktok", "tik-tok": "tiktok",
    "github": "github", "repos": "github", "repositories": "github",
    "podcast": "podcasts", "podcasts": "podcasts",
    "wiki": "wiki", "wikipedia": "wiki",
    "ai": "ai", "ai-context": "ai", "ai_context": "ai",
}
TRACKING_KEYS = {"fbclid", "gclid", "ref", "source"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--date", default=dt.date.today().isoformat())
    parser.add_argument("--count", type=int, default=100)
    return parser.parse_args()


def canonical_url(value: str) -> str:
    parts = urlsplit(value.strip())
    query = [
        (key, val) for key, val in parse_qsl(parts.query, keep_blank_values=True)
        if not key.lower().startswith("utm_") and key.lower() not in TRACKING_KEYS
    ]
    path = parts.path.rstrip("/") or "/"
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), path, urlencode(query), ""))


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:56] or "item"


def fit_words(value: str, limit: int) -> str:
    tokens = value.split()
    if len(tokens) <= limit:
        return " ".join(tokens)
    return " ".join(tokens[:limit]).rstrip(".,;:") + "."


def load_items(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    items = data.get("items") if isinstance(data, dict) else data
    if not isinstance(items, list):
        raise ValueError("input must be a JSON array or an object containing an items array")
    return items


def normalize(raw: dict, index: int) -> dict:
    missing = [key for key in ("source", "title", "url", "summary") if not raw.get(key)]
    if missing:
        raise ValueError(f"item {index}: missing {', '.join(missing)}")
    source = ALIASES.get(str(raw["source"]).strip().lower())
    if not source:
        raise ValueError(f"item {index}: unsupported source {raw['source']!r}")
    url = canonical_url(str(raw["url"]))
    if not url.startswith(("https://", "http://")):
        raise ValueError(f"item {index}: url must be http(s)")
    try:
        rank = max(1, int(raw.get("rank", 999999)))
    except (TypeError, ValueError) as exc:
        raise ValueError(f"item {index}: rank must be an integer") from exc
    return {
        **raw,
        "source": source,
        "title": str(raw["title"]).strip(),
        "url": url,
        "summary": str(raw["summary"]).strip(),
        "rank": rank,
    }


def select(items: list[dict], count: int) -> list[dict]:
    unique: list[dict] = []
    seen: set[str] = set()
    ordered = sorted(
        items,
        key=lambda item: (
            SOURCE_ORDER.index(item["source"]),
            item["rank"],
            item["title"].lower(),
        ),
    )
    for item in ordered:
        title_key = f"{item['source']}:{re.sub(r'[^a-z0-9]+', '', item['title'].lower())}"
        if item["url"] in seen or title_key in seen:
            continue
        seen.update((item["url"], title_key))
        unique.append(item)

    base, remainder = divmod(count, len(SOURCE_ORDER))
    quotas = {
        source: base + (1 if index < remainder else 0)
        for index, source in enumerate(SOURCE_ORDER)
    }
    chosen: list[dict] = []
    overflow: list[dict] = []
    for source in SOURCE_ORDER:
        group = [item for item in unique if item["source"] == source]
        chosen.extend(group[:quotas[source]])
        overflow.extend(group[quotas[source]:])
    if len(chosen) < count:
        overflow.sort(key=lambda item: (item["rank"], SOURCE_ORDER.index(item["source"])))
        chosen.extend(overflow[:count - len(chosen)])
    return chosen[:count]


def build_item(item: dict, batch_rank: int, run_date: str) -> dict:
    source_rank = item["rank"] if item["rank"] < 999999 else batch_rank
    hook = str(
        item.get("hook")
        or f"Number {source_rank} in today's {item['source']} signal: {item['title']}."
    )
    metric = str(
        item.get("metric") or item.get("evidence") or "It is gaining attention today."
    )
    takeaway = str(
        item.get("takeaway")
        or "Open the cited source and decide whether it belongs in your workflow."
    )
    cta = "Source linked. Follow Scroller for tomorrow's Top 100."
    context = "Save this ranking, then check the original link for full context and the latest numbers."
    narration = fit_words(
        " ".join((hook, item["summary"], metric, takeaway, context, cta)), 58
    )
    stable_id = f"{run_date}-{item['source']}-{source_rank:03d}-{slugify(item['title'])}"
    return {
        "id": stable_id,
        "batch_rank": batch_rank,
        "source": item["source"],
        "source_rank": source_rank,
        "title": item["title"],
        "url": item["url"],
        "metric": item.get("metric", ""),
        "evidence": item.get("evidence", ""),
        "retrieved_at": item.get("retrieved_at", ""),
        "ranking_type": item.get("ranking_type", "editorial_rank"),
        "audience": item.get("audience", "general"),
        "image_url": item.get("image_url", ""),
        "hook": hook,
        "narration": narration,
        "word_count": len(narration.split()),
        "visual_prompt": item.get(
            "visual_prompt",
            f"Editorial vertical motion graphic about {item['title']}; "
            "Scroller emerald accent; no text or logos",
        ),
        "shots": [
            {"start": 0, "end": 2, "purpose": "hook"},
            {"start": 2, "end": 5, "purpose": "rank-source-title"},
            {"start": 5, "end": 16, "purpose": "explanation"},
            {"start": 16, "end": 21, "purpose": "takeaway"},
            {"start": 21, "end": 24, "purpose": "attribution-cta"},
        ],
        "output_file": (
            f"videos/{batch_rank:03d}-{item['source']}-{source_rank:03d}-"
            f"{slugify(item['title'])}.mp4"
        ),
    }


def main() -> int:
    args = parse_args()
    if args.count < 1 or args.count > 100:
        raise ValueError("--count must be between 1 and 100")
    dt.date.fromisoformat(args.date)
    normalized = [
        normalize(raw, index)
        for index, raw in enumerate(load_items(args.input), 1)
    ]
    selected = select(normalized, args.count)
    built = [
        build_item(item, index, args.date)
        for index, item in enumerate(selected, 1)
    ]
    manifest = {
        "schema_version": "1.0",
        "brand": "Scroller",
        "date": args.date,
        "requested_count": args.count,
        "item_count": len(built),
        "render_spec": {
            "duration_seconds": 24,
            "width": 1080,
            "height": 1920,
            "fps": 30,
            "video_codec": "h264",
            "audio_codec": "aac",
        },
        "items": built,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {len(built)} of {args.count} requested items to {args.output}")
    if len(built) < args.count:
        print(
            f"warning: only {len(built)} credible unique candidates were supplied",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(2)
