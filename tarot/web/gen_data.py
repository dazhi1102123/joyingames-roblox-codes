#!/usr/bin/env python3
"""Emit the TypeScript card corpus from the Python one.

    python web/gen_data.py

The 78 cards, their meanings in five contexts, the suits, the ranks and the
spread definitions are content, not code -- transcribing 984 lines of it by
hand would introduce errors nobody would notice until a card page read wrong.
So the Python module stays the single source of truth and this regenerates
packages/core/src/data.generated.ts from it.

Run it after any edit to tarot_data.py. The generated file is committed, so
the Node side never needs Python to build.
"""

from __future__ import annotations

import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))

import tarot_data as td          # noqa: E402
import correspondences as corr   # noqa: E402

OUT = HERE / "packages" / "core" / "src" / "data.generated.ts"


def ts(value, indent=0):
    """JSON is valid TypeScript for the shapes here, and json.dumps escapes
    the em-dashes and apostrophes in the card text correctly."""
    return json.dumps(value, ensure_ascii=False, indent=2)


def spreads():
    out = {}
    for slug, spread in td.SPREADS.items():
        out[slug] = {
            "slug": spread["slug"],
            "name": spread["name"],
            "count": spread["count"],
            "tier": spread["tier"],
            "blurb": spread["blurb"],
            "positions": [
                {"name": name, "note": note} for name, note in spread["positions"]
            ],
        }
    return out


def ranks():
    return [{"number": n, "name": name, "roman": roman} for n, name, roman in td.RANKS]


def contexts():
    return [{"slug": slug, "label": label} for slug, label in td.CONTEXTS]


def cards():
    """Cards, with ctx normalised from a 2-tuple to a named pair.

    Python reads (up, rev) fine by position; TypeScript callers should not have
    to remember which index is which, so it becomes {up, rev} on the way out.
    """
    out = []
    for card in td.CARDS:
        entry = dict(card)
        entry["ctx"] = {
            slug: {"up": pair[0], "rev": pair[1]}
            for slug, pair in card["ctx"].items()
        }
        out.append(entry)
    return out


def correspondences():
    out = {}
    for card in td.CARDS:
        c = corr.correspondence(card)
        if c:
            out[card["slug"]] = c
    return out


def main():
    assert len(td.CARDS) == 78, f"expected 78 cards, got {len(td.CARDS)}"

    body = f'''// GENERATED FILE -- DO NOT EDIT.
// Regenerate with:  python web/gen_data.py
//
// The source of truth is tarot/tarot_data.py and tarot/correspondences.py.
// Editing this file directly means the next regeneration silently reverts you.

import type {{ Card, Suit, Rank, Context, Spread, Correspondence }} from "./types"

export const CONTEXTS: Context[] = {ts(contexts())}

export const SUITS: Record<string, Suit> = {ts(td.SUITS)}

export const RANKS: Rank[] = {ts(ranks())}

export const CARDS: Card[] = {ts(cards())}

export const SPREADS: Record<string, Spread> = {ts(spreads())}

export const CORRESPONDENCES: Record<string, Correspondence> = {ts(correspondences())}
'''
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(body, encoding="utf-8")

    print(f"{OUT.relative_to(HERE.parent)}")
    print(f"  {len(td.CARDS)} cards, {len(td.SPREADS)} spreads, "
          f"{len(td.CONTEXTS)} contexts, {OUT.stat().st_size:,} bytes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
