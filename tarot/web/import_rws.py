#!/usr/bin/env python3
"""Import the 1909 Rider-Waite-Smith deck into the site.

    python web/import_rws.py <directory-of-images>

Takes a directory of the 78 scans named the way Wikimedia Commons names them
(00-TheFool / RWS_Tarot_00_Fool for the majors, Cups01..Cups14 and the same
for Wands, Swords and Pents for the minors), maps each to a card slug, encodes
it as WebP and writes the manifest the site reads.

WebP because these are flat-ink lithographs: it reaches roughly a fifth of the
PNG size with no visible difference at the sizes the site renders, which keeps
the repository small and the deck index light.

Copyright: published 1909, illustrated by Pamela Colman Smith (1878-1951).
Public domain in the US (published before 1929) and in the EU (life + 70, so
since 1 January 2022). "Rider-Waite" is a trademark of U.S. Games Systems --
the images are free to use, the name is not free to brand with.
"""

from __future__ import annotations

import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))

import tarot_data as td  # noqa: E402

DEST = HERE / "apps" / "site" / "public" / "cards" / "rws"
MANIFEST = HERE / "packages" / "core" / "src" / "art.manifest.ts"

QUALITY = 88
SUIT_PREFIX = {"wands": "wands", "cups": "cups", "swords": "swords", "pentacles": "pents"}


def key_for(card):
    """The lookup key a source file name should reduce to."""
    if card["arcana"] == "major":
        return f"major{card['number']:02d}"
    return f"{SUIT_PREFIX[card['suit']]}{card['number']:02d}"


def index_source(directory):
    """Map every image in the directory to the same key space.

    Accepts both naming conventions seen in the wild -- "00-TheFool.png" and
    "RWS_Tarot_00_Fool.jpg" for majors, "Cups01" and "cups01" for minors --
    because the two public sources disagree and neither is worth normalising
    by hand 78 times.
    """
    found = {}
    for path in sorted(directory.iterdir()):
        if path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
            continue
        stem = path.stem.lower()

        major = re.match(r"^(?:rws_tarot_)?(\d{2})[-_]", stem)
        if major:
            found[f"major{int(major.group(1)):02d}"] = path
            continue

        minor = re.match(r"^(wands|cups|swords|pents|pentacles)[-_]?(\d{1,2})$", stem)
        if minor:
            suit = "pents" if minor.group(1).startswith("pent") else minor.group(1)
            found[f"{suit}{int(minor.group(2)):02d}"] = path
    return found


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    source = pathlib.Path(sys.argv[1]).expanduser().resolve()
    if not source.is_dir():
        print(f"not a directory: {source}")
        return 1

    try:
        from PIL import Image
    except ImportError:
        print("Pillow is needed to encode WebP:  pip install pillow")
        return 1

    available = index_source(source)
    print(f"{len(available)} images found in {source}")

    DEST.mkdir(parents=True, exist_ok=True)
    written, missing = [], []
    total_in = total_out = 0

    for card in td.CARDS:
        path = available.get(key_for(card))
        if not path:
            missing.append(card["slug"])
            continue
        image = Image.open(path).convert("RGB")
        target = DEST / f"{card['slug']}.webp"
        image.save(target, "WEBP", quality=QUALITY, method=6)
        total_in += path.stat().st_size
        total_out += target.stat().st_size
        written.append(card["slug"])

    MANIFEST.write_text(
        "// GENERATED FILE -- DO NOT EDIT.\n"
        "// Regenerate with:  python web/import_rws.py <image-directory>\n"
        "//\n"
        "// Slugs with a Rider-Waite-Smith scan in public/cards/rws/. Any card\n"
        "// not listed here falls back to the site's own drawn SVG face.\n\n"
        "export const RWS_AVAILABLE: ReadonlySet<string> = new Set(\n"
        f"{json.dumps(sorted(written), indent=2)}\n)\n",
        encoding="utf-8",
    )

    print(f"{len(written)} cards written to {DEST.relative_to(HERE.parent)}")
    if total_in:
        print(f"  {total_in / 1e6:.1f} MB PNG -> {total_out / 1e6:.1f} MB WebP "
              f"({total_out / total_in:.0%})")
    if missing:
        print(f"  ! no image for {len(missing)}: {', '.join(missing[:8])}"
              f"{' …' if len(missing) > 8 else ''}")
        print("    those cards keep the drawn SVG face.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
