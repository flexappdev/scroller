#!/usr/bin/env python3
"""Build the scroller.tv Books channel data (data/books/).

Two sources, both read-only from here:

  1. Our books: flexappdev/bookai (the vault side of claude-bookai).
     books/catalogue.json (public books, order), books/store.json (Gumroad),
     apps/scroller/public/books/<slug>.json (chapter feeds), and
     books/<slug>/book.json as a fallback when a book has no feed yet.
     Media paths in the feeds point at matsiems.com; pass --ms to keep only
     the ones that really exist in a flexappdev/ms checkout.

  2. Top non-fiction of all time: public Goodreads-derived datasets.
     - Best Books Ever (Lozano & Costa Planells, 2020, CC BY-NC 4.0)
       https://github.com/scostap/goodreads_bbe_dataset
     - goodbooks-10k (Zajac, 2017, CC BY-SA 4.0)
       https://github.com/zygmuntz/goodbooks-10k
     Only factual fields are kept (title, author, year, pages, rating,
     ratings count, top shelves). No blurbs or cover images are copied.
     Ranked by Goodreads ratings count, most-rated first.

Usage:
  python3 scripts/books-sync.py --bookai ../bookai [--ms ../ms] \
      [--bbe books_1.Best_Books_Ever.csv --goodbooks goodbooks-10k/]

Without --bbe/--goodbooks the existing data/books/top-nonfiction.json is kept.
"""

from __future__ import annotations

import argparse
import ast
import csv
import json
import re
import subprocess
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "books"
MS = "https://www.matsiems.com"
TARGET = 10_000
MIN_RATINGS = 100  # below this the "of all time" claim stops meaning anything

# Shelves that mark a book as fiction (or not prose non-fiction) when they lead.
FICTION = {
    "Fiction", "Fantasy", "Novels", "Historical Fiction", "Romance", "Science Fiction",
    "Mystery", "Thriller", "Young Adult", "Horror", "Plays", "Short Stories", "Childrens",
    "Picture Books", "Comics", "Graphic Novels", "Manga", "Literary Fiction", "Chick Lit",
    "Dystopia", "Paranormal", "Contemporary", "Urban Fantasy", "Mystery Thriller", "Crime",
    "Drama", "Middle Grade", "Adventure", "Magic", "Vampires", "Erotica", "Retellings",
    "Poetry", "Womens Fiction", "Suspense", "Comic Book", "Graphic Novels Comics",
}
NONFICTION = {
    "Nonfiction", "History", "Biography", "Memoir", "Autobiography", "Science", "Philosophy",
    "Self Help", "Psychology", "Business", "Economics", "Politics", "Travel", "Essays",
    "True Crime", "Health", "Cookbooks", "Spirituality", "Christian Living",
    "Personal Development", "Productivity", "Leadership", "Sociology", "Biology", "Physics",
    "Mathematics", "Journalism", "Food", "Art", "Writing", "Parenting", "Education",
    "Social Science", "Anthropology", "Nature", "Military History", "Theology", "Feminism",
    "Sports", "Music", "Language", "Reference", "Finance", "Management", "Religion",
    "Neuroscience", "Astronomy", "Space", "Medicine", "Environment", "Technology",
}
SKIP_SHELVES = {"Nonfiction", "Audiobook", "Classics", "Book Club", "Adult", "Unfinished"}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data, compact=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    if compact:
        text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    else:
        text = json.dumps(data, ensure_ascii=False, indent=2)
    path.write_text(text + "\n", encoding="utf-8")


def git_head(path: Path) -> str | None:
    try:
        return subprocess.run(["git", "-C", str(path), "rev-parse", "--short=8", "HEAD"],
                              capture_output=True, text=True, check=True).stdout.strip()
    except Exception:
        return None


def ms_files(ms: Path | None) -> set[str] | None:
    if not ms:
        return None
    out = subprocess.run(["git", "-C", str(ms), "ls-tree", "-r", "--name-only", "HEAD"],
                         capture_output=True, text=True, check=True).stdout
    return {line[len("public"):] for line in out.splitlines() if line.startswith("public/")}


def clip(text: str | None, limit: int) -> str:
    text = re.sub(r"\s+", " ", (text or "")).strip()
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0].rstrip(",;:-–—")
    return cut + "…"


def first_sentence(text: str | None, limit=220) -> str:
    text = re.sub(r"\s+", " ", (text or "")).strip()
    m = re.match(r"(.+?[.!?])(\s|$)", text)
    return clip(m.group(1) if m else text, limit)


# --------------------------------------------------------------------------- our books

def build_ours(bookai: Path, ms: set[str] | None):
    catalogue = load_json(bookai / "books" / "catalogue.json")["books"]
    store = {p["slug"]: p for p in load_json(bookai / "books" / "store.json").get("products", [])}
    feeds = bookai / "apps" / "scroller" / "public" / "books"
    posters = ROOT / "public" / "books" / "posters"

    def media(path: str | None) -> str | None:
        if not path:
            return None
        if path.startswith("http"):
            return path
        if ms is not None and path not in ms:
            return None
        return MS + path

    books, total_chapters = [], 0
    for b in sorted(catalogue, key=lambda x: x.get("order", 999)):
        if b.get("visibility") != "public":
            continue
        slug = b["slug"]
        feed = feeds / f"{slug}.json"
        chapters = []
        if feed.exists():
            for c in load_json(feed)["chapters"]:
                chapters.append({
                    "n": c["n"],
                    "part": c.get("part"),
                    "title": c["title"],
                    "tease": clip(c.get("tease") or first_sentence(c.get("hook")), 240),
                    "facts": [{"label": f["label"], "value": f["value"]} for f in (c.get("facts") or [])[:3]],
                    "image": media(c.get("diagram")),
                    "video": media(c.get("film")),
                    "poster": media(c.get("poster")),
                    "read": MS + c["read"] if c.get("read", "").startswith("/") else c.get("read"),
                    "free": bool(c.get("free")),
                    "minutes": c.get("minutes"),
                })
        else:
            book_json = bookai / "books" / slug / "book.json"
            if book_json.exists():
                bj = load_json(book_json)
                parts = {p["id"]: p.get("title") for p in bj.get("parts", [])}
                for c in bj.get("chapters", []):
                    n = int(c["n"])
                    chapters.append({
                        "n": n,
                        "part": parts.get(c.get("part"), c.get("part")),
                        "title": c.get("t") or c.get("title"),
                        "tease": clip(c.get("cap") or first_sentence(c.get("body")), 240),
                        "facts": [],
                        "image": media(f"/images/books/chapters/{slug}/{n:03d}.svg"),
                        "video": None,
                        "poster": None,
                        "read": f"{MS}/books/{slug}?ch={n}#c{n}",
                        "free": False,
                        "minutes": None,
                    })
        prod = store.get(slug, {})
        live = prod.get("status") == "live"
        entry = {
            "slug": slug,
            "title": b["title"],
            "subtitle": b.get("subtitle"),
            "volume": b.get("volume"),
            "blurb": b.get("blurb"),
            "collection": b.get("collection"),
            "chapters": len(chapters) or b.get("chapters"),
            "free": sum(1 for c in chapters if c["free"]),
            "cover": f"/books/posters/{slug}.webp" if (posters / f"{slug}.webp").exists() else None,
            "url": f"{MS}/books/{slug}",
            "buy": prod.get("url") if live else None,
            "price": prod.get("price") if live else None,
            "hasFeed": bool(chapters),
        }
        books.append(entry)
        total_chapters += len(chapters)
        if chapters:
            write_json(OUT / "bookai" / f"{slug}.json", {"slug": slug, "chapters": chapters}, compact=True)
    return books, total_chapters


# --------------------------------------------------------------------------- top non-fiction

def norm_title(t: str) -> str:
    t = re.split(r"[:(]", t, maxsplit=1)[0]
    return re.sub(r"[^a-z0-9]", "", t.lower())[:50]


def primary_author(raw: str) -> str:
    for part in raw.split(","):
        part = part.strip()
        role = re.search(r"\(([^)]*)\)", part)
        name = re.sub(r"\s*\([^)]*\)", "", part).strip()
        if not name:
            continue
        if role and "goodreads author" not in role.group(1).lower():
            continue  # translator, editor, foreword…
        return name
    return re.sub(r"\s*\([^)]*\)", "", raw.split(",")[0]).strip()


def year_of(*values: str) -> int | None:
    for v in values:
        m = re.search(r"\b(1[0-9]{3}|20[0-2][0-9])\b", v or "")
        if m:
            return int(m.group(1))
    return None


def is_nonfiction(shelves: list[str]) -> bool:
    if not shelves:
        return False
    s = set(shelves)
    if "Nonfiction" in s:
        lead = set(shelves[:3])
        return not (lead & {"Fiction", "Novels", "Fantasy", "Science Fiction", "Romance", "Historical Fiction",
                            "Young Adult", "Graphic Novels", "Comics", "Manga", "Picture Books", "Childrens",
                            "Poetry", "Plays"})
    return not (s & FICTION) and bool(set(shelves[:2]) & NONFICTION)


def build_top_nonfiction(bbe_csv: Path, goodbooks: Path):
    csv.field_size_limit(10 ** 9)
    merged: dict[tuple[str, str], dict] = {}
    by_gr: dict[str, tuple[str, str]] = {}

    def add(row: dict, prefer_title=True):
        key = (norm_title(row["title"]), row["author"].split()[-1].lower() if row["author"] else "")
        key = by_gr.get(row["gr"], key)  # same Goodreads id = same book, whatever the title
        cur = merged.get(key)
        if not cur:
            merged[key] = row
            by_gr[row["gr"]] = key
            return
        best, other = (row, cur) if row["ratings"] > cur["ratings"] else (cur, row)
        best["year"] = best["year"] or other["year"]
        best["pages"] = best["pages"] or other["pages"]
        best["shelves"] = best["shelves"] or other["shelves"]
        if not prefer_title:  # keep the first (English, edition) title over goodbooks' original title
            best["title"] = cur["title"]
        merged[key] = best
        by_gr[row["gr"]] = key

    with bbe_csv.open(encoding="utf-8") as fh:
        for x in csv.DictReader(fh):
            try:
                shelves = ast.literal_eval(x["genres"]) if x["genres"] else []
            except (ValueError, SyntaxError):
                shelves = []
            if not is_nonfiction(shelves):
                continue
            try:
                ratings = int(float(x["numRatings"] or 0))
                pages = int(re.sub(r"\D", "", x["pages"] or "") or 0) or None
                rating = round(float(x["rating"] or 0), 2) or None
            except ValueError:
                continue
            add({
                "title": x["title"].strip(),
                "author": primary_author(x["author"]),
                "year": year_of(x["firstPublishDate"], x["publishDate"]),
                "pages": pages,
                "rating": rating,
                "ratings": ratings,
                "shelves": [s for s in shelves if s not in SKIP_SHELVES][:3],
                "gr": x["bookId"].split(".")[0].split("-")[0],
            })

    # goodbooks-10k: use user shelves to decide non-fiction.
    tags = {r["tag_id"]: r["tag_name"] for r in csv.DictReader((goodbooks / "tags.csv").open(encoding="utf-8"))}
    book_tags: dict[str, dict[str, int]] = defaultdict(dict)
    for r in csv.DictReader((goodbooks / "book_tags.csv").open(encoding="utf-8")):
        book_tags[r["goodreads_book_id"]][tags.get(r["tag_id"], "")] = int(r["count"])
    for b in csv.DictReader((goodbooks / "books.csv").open(encoding="utf-8")):
        t = book_tags.get(b["goodreads_book_id"], {})
        nf = t.get("non-fiction", 0) + t.get("nonfiction", 0)
        if nf < 20 or nf <= t.get("fiction", 0):
            continue
        top = [k for k, _ in sorted(t.items(), key=lambda kv: -kv[1])
               if k not in {"to-read", "currently-reading", "favorites", "non-fiction", "nonfiction",
                            "owned", "books-i-own", "default", "kindle", "ebook", "audiobook", "library",
                            "to-buy", "owned-books", "my-books", "audiobooks", "audio", "wish-list", "own",
                            "favourites", "book-club", "re-read", "abandoned", "did-not-finish"}][:3]
        year = b["original_publication_year"]
        add({
            "title": re.sub(r"\s*\([^)]*#\d+[^)]*\)$", "", b["title"]).strip(),
            "author": primary_author(b["authors"]),
            "year": int(float(year)) if year and float(year) > 0 else None,
            "pages": None,
            "rating": round(float(b["average_rating"] or 0), 2) or None,
            "ratings": int(b["work_ratings_count"] or b["ratings_count"] or 0),
            "shelves": [s.replace("-", " ").title() for s in top],
            "gr": b["goodreads_book_id"],
        }, prefer_title=False)

    rows = [r for r in merged.values() if r["ratings"] >= MIN_RATINGS and r["title"]]
    rows.sort(key=lambda r: (-r["ratings"], r["title"]))
    rows = rows[:TARGET]
    # Compact columns: rank is the index + 1.
    cols = ["title", "author", "year", "pages", "rating", "ratings", "shelves", "gr"]
    return {
        "columns": cols,
        "target": TARGET,
        "minRatings": MIN_RATINGS,
        "rankedBy": "Goodreads ratings count, most-rated first",
        "sources": [
            {"name": "Best Books Ever dataset (Lozano & Costa Planells, 2020)", "licence": "CC BY-NC 4.0",
             "url": "https://github.com/scostap/goodreads_bbe_dataset"},
            {"name": "goodbooks-10k (Zajac, 2017)", "licence": "CC BY-SA 4.0",
             "url": "https://github.com/zygmuntz/goodbooks-10k"},
        ],
        "rows": [[r[c] for c in cols] for r in rows],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--bookai", type=Path, required=True)
    ap.add_argument("--ms", type=Path)
    ap.add_argument("--bbe", type=Path)
    ap.add_argument("--goodbooks", type=Path)
    ap.add_argument("--write-vault", action="store_true",
                    help="also write <bookai>/vault/promo/scroller.json (scroller.tv links per book)")
    a = ap.parse_args()

    ms = ms_files(a.ms)
    books, chapters = build_ours(a.bookai, ms)

    top_path = OUT / "top-nonfiction.json"
    if a.bbe and a.goodbooks:
        top = build_top_nonfiction(a.bbe, a.goodbooks)
        write_json(top_path, top, compact=True)
    top = load_json(top_path) if top_path.exists() else {"rows": []}

    channel = {
        "$comment": "Generated by scripts/books-sync.py from flexappdev/bookai (vault) — do not edit by hand.",
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "bookai": git_head(a.bookai),
        "ms": git_head(a.ms) if a.ms else None,
        "counts": {"ours": len(books), "ourChapters": chapters, "topNonfiction": len(top["rows"]),
                   "topNonfictionTarget": TARGET},
        "ours": books,
    }
    write_json(OUT / "channel.json", channel)

    if a.write_vault:
        site = "https://www.scroller.tv"
        write_json(a.bookai / "vault" / "promo" / "scroller.json", {
            "$comment": "Written by flexappdev/scroller scripts/books-sync.py --write-vault. scroller owns this file: "
                        "where each public book can be scrolled on scroller.tv. Do not edit in bookai.",
            "updated_at": channel["generatedAt"],
            "bookai_commit": channel["bookai"],
            "channel": f"{site}/books",
            "scrollAll": f"{site}/books/scroll",
            "topNonfiction": {"url": f"{site}/books/top-nonfiction/1", "ranked": len(top["rows"]), "target": TARGET},
            "books": [
                {"slug": b["slug"], "url": f"{site}/books/{b['slug']}" if b["hasFeed"] else None,
                 "chapters": b["chapters"], "free": b["free"]}
                for b in books
            ],
        })
    print(f"ours: {len(books)} books, {chapters} chapters · top non-fiction: {len(top['rows'])}/{TARGET}")


if __name__ == "__main__":
    main()
