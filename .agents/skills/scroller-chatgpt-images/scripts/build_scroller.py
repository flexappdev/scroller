#!/usr/bin/env python3
"""Build/update a minimal standalone image Scroller from a local image directory.

This is the fallback implementation referenced by SKILL.md. In a real Scroller
repository, the skill should integrate with the existing app instead.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import shutil
from pathlib import Path

SUPPORTED = {".png", ".jpg", ".jpeg", ".webp", ".avif"}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def image_size(path: Path):
    try:
        from PIL import Image
        with Image.open(path) as im:
            return int(im.width), int(im.height)
    except Exception:
        return None, None


def load_existing(manifest_path: Path, feed: str) -> list[dict]:
    if not manifest_path.exists():
        return []
    try:
        data = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception:
        return []
    if isinstance(data, dict):
        data = data.get("items", [])
    if not isinstance(data, list):
        return []
    items = [x for x in data if isinstance(x, dict) and x.get("feed") == feed]
    items.sort(key=lambda x: int(x.get("ordinal") or 0))
    return items


def build_html(feed: str, items: list[dict], mode: str) -> str:
    payload = json.dumps(items, ensure_ascii=False).replace("</", "<\\/")
    horizontal = mode == "horizontal"
    axis_css = (
        "height: 100dvh; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory; display: flex;"
        if horizontal
        else "height: 100dvh; overflow-y: auto; overflow-x: hidden; scroll-snap-type: y mandatory;"
    )
    item_css = (
        "position: relative; height: 100dvh; min-width: 100vw; width: 100vw; flex: 0 0 100vw; scroll-snap-align: start; display: grid; place-items: center; overflow: hidden; background: #090909;"
        if horizontal
        else "position: relative; height: 100dvh; width: 100%; scroll-snap-align: start; display: grid; place-items: center; overflow: hidden; background: #090909;"
    )
    keys = "['ArrowRight','ArrowLeft','PageDown','PageUp']" if horizontal else "['ArrowDown','ArrowUp','PageDown','PageUp']"
    positive = "e.key === 'ArrowRight' || e.key === 'PageDown'" if horizontal else "e.key === 'ArrowDown' || e.key === 'PageDown'"
    scroll_arg = "left" if horizontal else "top"
    client_arg = "clientWidth" if horizontal else "clientHeight"
    hint = "← →" if horizontal else "↑ ↓"
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{feed} scroller · {mode}</title>
<style>
:root {{ color-scheme: dark; font-family: ui-sans-serif, system-ui, sans-serif; }}
* {{ box-sizing: border-box; }}
html, body {{ margin: 0; background: #090909; color: #fff; }}
body {{ overflow: hidden; }}
#scroller {{ {axis_css} overscroll-behavior: contain; }}
.item {{ {item_css} }}
.bg {{ position: absolute; inset: -24px; width: calc(100% + 48px); height: calc(100% + 48px); object-fit: cover; filter: blur(34px); opacity: .28; transform: scale(1.04); }}
.main {{ position: relative; z-index: 1; width: 100%; height: 100%; object-fit: contain; }}
.meta {{ position: absolute; z-index: 2; left: 16px; right: 16px; bottom: max(16px, env(safe-area-inset-bottom)); display: flex; justify-content: space-between; gap: 12px; pointer-events: none; text-shadow: 0 1px 4px #000; }}
.badge {{ background: rgba(0,0,0,.48); border: 1px solid rgba(255,255,255,.18); border-radius: 999px; padding: 7px 10px; backdrop-filter: blur(10px); }}
.hint {{ opacity: .72; }}
@media (min-width: 900px) {{ .main {{ max-width: 92vw; max-height: 92vh; }} }}
</style>
</head>
<body>
<main id="scroller" aria-label="{feed} image scroller · {mode}"></main>
<script>
const items = {payload};
const root = document.getElementById('scroller');
for (const item of items) {{
  const section = document.createElement('section');
  section.className = 'item';
  section.id = item.id;
  const bg = document.createElement('img');
  bg.className = 'bg'; bg.src = item.src; bg.alt = ''; bg.loading = 'lazy'; bg.setAttribute('aria-hidden', 'true');
  const img = document.createElement('img');
  img.className = 'main'; img.src = item.src; img.alt = item.caption || `Generated image ${{item.ordinal}}`; img.loading = item.ordinal <= 2 ? 'eager' : 'lazy';
  const meta = document.createElement('div'); meta.className = 'meta';
  meta.innerHTML = `<span class="badge">${{item.feed}} · ${{item.ordinal}}/${{items.length}}</span><span class="badge hint">{hint}</span>`;
  section.append(bg, img, meta); root.appendChild(section);
}}
window.addEventListener('keydown', (e) => {{
  if (!{keys}.includes(e.key)) return;
  e.preventDefault();
  root.scrollBy({{{scroll_arg}: ({positive} ? 1 : -1) * root.{client_arg}, behavior: 'smooth'}});
}});
</script>
</body>
</html>'''


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True, type=Path)
    p.add_argument("--output", required=True, type=Path)
    p.add_argument("--feed", default="siema")
    p.add_argument("--source-url", default=None)
    p.add_argument("--source-title", default=None)
    args = p.parse_args()

    files = sorted([x for x in args.input.rglob("*") if x.is_file() and x.suffix.lower() in SUPPORTED])
    args.output.mkdir(parents=True, exist_ok=True)
    media_dir = args.output / "media" / args.feed / "original"
    media_dir.mkdir(parents=True, exist_ok=True)

    manifest_path = args.output / "manifest.json"
    items = load_existing(manifest_path, args.feed)
    seen = {x.get("sha256") for x in items if x.get("sha256")}
    next_ordinal = max([int(x.get("ordinal") or 0) for x in items], default=0) + 1
    added = 0
    skipped = 0

    for src in files:
        digest = sha256(src)
        if digest in seen:
            skipped += 1
            continue
        seen.add(digest)
        ordinal = next_ordinal
        next_ordinal += 1
        dst_name = f"{ordinal:05d}-{digest[:12]}{src.suffix.lower()}"
        dst = media_dir / dst_name
        shutil.copy2(src, dst)
        width, height = image_size(dst)
        items.append({
            "id": f"{args.feed}-{digest[:16]}",
            "feed": args.feed,
            "ordinal": ordinal,
            "type": "image",
            "src": f"media/{args.feed}/original/{dst_name}",
            "width": width,
            "height": height,
            "aspect_ratio": round(width / height, 6) if width and height else None,
            "sha256": digest,
            "prompt": None,
            "caption": None,
            "source_title": args.source_title,
            "source_url": args.source_url,
            "source_message_id": None,
            "created_at": None,
            "source_quality": "original",
            "tags": [args.feed, "generated"],
            "mime_type": mimetypes.guess_type(dst.name)[0],
        })
        added += 1

    items.sort(key=lambda x: int(x.get("ordinal") or 0))
    manifest_path.write_text(json.dumps(items, indent=2, ensure_ascii=False), encoding="utf-8")
    (args.output / "index.html").write_text(build_html(args.feed, items, "vertical"), encoding="utf-8")
    (args.output / "horizontal.html").write_text(build_html(args.feed, items, "horizontal"), encoding="utf-8")
    print(json.dumps({
        "feed": args.feed,
        "discovered": len(files),
        "added": added,
        "skipped": skipped,
        "items": len(items),
        "output": str(args.output),
        "vertical": "index.html",
        "horizontal": "horizontal.html",
    }, indent=2))


if __name__ == "__main__":
    main()
