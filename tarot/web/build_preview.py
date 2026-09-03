#!/usr/bin/env python3
"""Build a single self-contained HTML preview of the site.

    python web/build_preview.py <out.html>

The real site is a Next.js server app over SQLite -- it cannot be handed to
someone as a file. This packs the parts that do not need a server into one
page: the card corpus, the 1909 artwork as data URIs, and the reading engine
ported to plain JS, so the draw is genuinely live rather than a screenshot.

What it deliberately cannot include: ordering from a reader, the reader's
desk, the operator console, the mailing list. Those need a database and a
session, and pretending otherwise would be worse than leaving them out.
"""

from __future__ import annotations

import base64
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))

import tarot_data as td          # noqa: E402
import correspondences as corr   # noqa: E402

IMAGES = HERE / "apps" / "site" / "public" / "cards" / "rws"
TOKENS = HERE / "apps" / "site" / "app" / "tokens.css"


def cards_payload():
    out = []
    for card in td.CARDS:
        c = corr.correspondence(card)
        out.append({
            "slug": card["slug"],
            "name": card["name"],
            "arcana": card["arcana"],
            "suit": card["suit"],
            "number": card["number"],
            "roman": card["roman"],
            "element": card["element"],
            "astrology": card["astrology"],
            "yesno": card["yesno"],
            "upKeys": card["up_keys"],
            "revKeys": card["rev_keys"],
            "up": card["up"],
            "rev": card["rev"],
            "ctx": {k: {"up": v[0], "rev": v[1]} for k, v in card["ctx"].items()},
            "colour": c["colour"],
            "hex": c["hex"],
            "stone": c["stone"],
        })
    return out


def images_payload():
    out = {}
    for card in td.CARDS:
        path = IMAGES / f"{card['slug']}.webp"
        if not path.exists():
            raise SystemExit(f"missing artwork: {path}")
        blob = base64.b64encode(path.read_bytes()).decode("ascii")
        out[card["slug"]] = f"data:image/webp;base64,{blob}"
    return out


def spreads_payload():
    return {
        slug: {
            "slug": s["slug"], "name": s["name"], "count": s["count"],
            "blurb": s["blurb"],
            "positions": [{"name": n, "note": d} for n, d in s["positions"]],
        }
        for slug, s in td.SPREADS.items()
    }


def suits_payload():
    return {k: {"name": v["name"], "element": v["element"], "domain": v["domain"]}
            for k, v in td.SUITS.items()}


def main():
    out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "preview.html")

    data = {
        "cards": cards_payload(),
        "spreads": spreads_payload(),
        "suits": suits_payload(),
        "contexts": [{"slug": s, "label": l} for s, l in td.CONTEXTS],
    }

    template = (HERE / "preview_template.html").read_text(encoding="utf-8")
    html = (template
            .replace("/*__TOKENS__*/", TOKENS.read_text(encoding="utf-8"))
            .replace("__DATA__", json.dumps(data, ensure_ascii=False, separators=(",", ":")))
            .replace("__ART__", json.dumps(images_payload(), separators=(",", ":"))))

    out.write_text(html, encoding="utf-8")
    print(f"{out}  {out.stat().st_size / 1e6:.2f} MB  "
          f"({len(data['cards'])} cards, {len(data['spreads'])} spreads)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
