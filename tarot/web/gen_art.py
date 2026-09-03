#!/usr/bin/env python3
"""Emit the 78 card faces as a TypeScript module.

    python web/gen_art.py

cardart.py is 480 lines of hand-placed SVG geometry -- pip layouts, court
devices, 22 major emblems. Re-deriving that in TypeScript would risk a subtle
misplacement on some card nobody looks at for months, so the Python keeps
drawing and this bakes the result.

The faces keep their CSS custom properties (var(--card-line) and friends), so
the React side inlines them and they still follow the light/dark theme. The
email path is the one that needs literals, and that stays in Python.
"""

from __future__ import annotations

import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))

import cardart      # noqa: E402
import tarot_data as td  # noqa: E402

OUT = HERE / "packages" / "core" / "src" / "art.generated.ts"


def main():
    faces = {card["slug"]: cardart.card_svg(card) for card in td.CARDS}
    assert len(faces) == 78, f"expected 78 faces, got {len(faces)}"
    for slug, svg in faces.items():
        assert svg.startswith("<svg"), f"{slug} did not render an svg"

    body = f'''// GENERATED FILE -- DO NOT EDIT.
// Regenerate with:  python web/gen_art.py
//
// The source of truth is tarot/cardart.py. These strings keep their CSS
// custom properties, so an inlined face follows the active theme.

/** Card face SVG, keyed by card slug. */
export const CARD_FACES: Record<string, string> = {json.dumps(faces, ensure_ascii=False, indent=2)}

/** The back of the deck, for the shuffling state. */
export const CARD_BACK: string = {json.dumps(cardart.card_back_svg())}
'''
    OUT.write_text(body, encoding="utf-8")
    print(f"{OUT.relative_to(HERE.parent)}")
    print(f"  78 faces, {OUT.stat().st_size:,} bytes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
