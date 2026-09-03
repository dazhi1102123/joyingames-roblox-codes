#!/usr/bin/env python3
"""Download the 1909 Rider-Waite-Smith scans from Wikimedia Commons.

    python web/fetch_rws.py              # into apps/site/public/cards/rws/
    python web/fetch_rws.py --check      # resolve names only, download nothing

Run this on a machine with normal internet access. The build container this
was written in blocks Wikimedia at the proxy, so the images are not committed;
the site renders its own SVG deck until they are present and switches over
automatically once they are.

Copyright: the deck was published in 1909 and illustrated by Pamela Colman
Smith, who died in 1951. That puts it in the public domain in the US (published
before 1929) and in the EU (life + 70, so from 1 January 2022). "Rider-Waite"
is a trademark of U.S. Games Systems -- the images are free to use, the name is
not free to brand with. Take the 1909 scans, not a later recolouring.
"""

from __future__ import annotations

import argparse
import json
import pathlib
import sys
import urllib.error
import urllib.parse
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))

import tarot_data as td  # noqa: E402

DEST = HERE / "apps" / "site" / "public" / "cards" / "rws"
MANIFEST = HERE / "packages" / "core" / "src" / "art.manifest.ts"

# Commons resolves a title to the file itself, following renames, so this
# survives a page move that a hardcoded upload.wikimedia.org URL would not.
FILEPATH = "https://commons.wikimedia.org/wiki/Special:FilePath/"
API = "https://commons.wikimedia.org/w/api.php"

UA = "ArcanaPress/0.1 (public-domain deck fetch; contact via site operator)"

# Major arcana file names on Commons. The minor arcana follow a regular
# pattern and are derived below.
MAJORS = {
    "the-fool": "RWS_Tarot_00_Fool.jpg",
    "the-magician": "RWS_Tarot_01_Magician.jpg",
    "the-high-priestess": "RWS_Tarot_02_High_Priestess.jpg",
    "the-empress": "RWS_Tarot_03_Empress.jpg",
    "the-emperor": "RWS_Tarot_04_Emperor.jpg",
    "the-hierophant": "RWS_Tarot_05_Hierophant.jpg",
    "the-lovers": "RWS_Tarot_06_Lovers.jpg",
    "the-chariot": "RWS_Tarot_07_Chariot.jpg",
    "strength": "RWS_Tarot_08_Strength.jpg",
    "the-hermit": "RWS_Tarot_09_Hermit.jpg",
    "wheel-of-fortune": "RWS_Tarot_10_Wheel_of_Fortune.jpg",
    "justice": "RWS_Tarot_11_Justice.jpg",
    "the-hanged-man": "RWS_Tarot_12_Hanged_Man.jpg",
    "death": "RWS_Tarot_13_Death.jpg",
    "temperance": "RWS_Tarot_14_Temperance.jpg",
    "the-devil": "RWS_Tarot_15_Devil.jpg",
    "the-tower": "RWS_Tarot_16_Tower.jpg",
    "the-star": "RWS_Tarot_17_Star.jpg",
    "the-moon": "RWS_Tarot_18_Moon.jpg",
    "the-sun": "RWS_Tarot_19_Sun.jpg",
    "judgement": "RWS_Tarot_20_Judgement.jpg",
    "the-world": "RWS_Tarot_21_World.jpg",
}

SUIT_PREFIX = {"wands": "Wands", "cups": "Cups", "swords": "Swords", "pentacles": "Pents"}


def commons_name(card):
    """The Commons file name for one card, or None if we cannot guess it."""
    if card["arcana"] == "major":
        return MAJORS.get(card["slug"])
    prefix = SUIT_PREFIX.get(card["suit"])
    if not prefix:
        return None
    return f"{prefix}{card['number']:02d}.jpg"


def exists(names):
    """Ask Commons which of these titles actually exist.

    Batched, because 78 individual HEAD requests is rude to a volunteer-funded
    service and slower than one query. Returns the set that resolved.
    """
    found = set()
    batch = list(names)
    for i in range(0, len(batch), 40):
        titles = "|".join(f"File:{n}" for n in batch[i:i + 40])
        query = urllib.parse.urlencode({
            "action": "query", "format": "json", "titles": titles,
        })
        req = urllib.request.Request(f"{API}?{query}", headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.load(r)
        for page in data.get("query", {}).get("pages", {}).values():
            if "missing" not in page:
                found.add(page["title"].removeprefix("File:").replace(" ", "_"))
    return found


def download(name, target):
    req = urllib.request.Request(FILEPATH + urllib.parse.quote(name),
                                 headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    if len(data) < 4096:
        raise ValueError(f"suspiciously small ({len(data)} bytes)")
    target.write_bytes(data)
    return len(data)


def write_manifest(have):
    """Tell the site which slugs have a real scan.

    A manifest rather than a filesystem check at render time: server components
    should not stat the disk per card, and this way the fallback is decided at
    build time and is identical on every request.
    """
    MANIFEST.write_text(
        "// GENERATED FILE -- DO NOT EDIT.\n"
        "// Regenerate with:  python web/fetch_rws.py\n"
        "//\n"
        "// Slugs with a Rider-Waite-Smith scan in public/cards/rws/. Any card\n"
        "// not listed here falls back to the site's own SVG face.\n\n"
        "export const RWS_AVAILABLE: ReadonlySet<string> = new Set(\n"
        f"{json.dumps(sorted(have), indent=2)}\n)\n",
        encoding="utf-8",
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="resolve names against Commons, download nothing")
    args = ap.parse_args()

    wanted = {}
    unmapped = []
    for card in td.CARDS:
        name = commons_name(card)
        if name:
            wanted[card["slug"]] = name
        else:
            unmapped.append(card["slug"])

    print(f"{len(wanted)} of {len(td.CARDS)} cards mapped to a Commons file name")
    if unmapped:
        print(f"  ! no mapping for: {', '.join(unmapped)}")

    try:
        present = exists(wanted.values())
    except urllib.error.URLError as err:
        print(f"\nCould not reach Commons: {err}")
        print("Run this from a machine with normal internet access.")
        return 1

    missing = {s: n for s, n in wanted.items() if n not in present}
    print(f"{len(wanted) - len(missing)} confirmed on Commons")
    for slug, name in sorted(missing.items()):
        print(f"  ! {slug}: File:{name} does not exist -- fix the mapping")

    if args.check:
        return 0

    DEST.mkdir(parents=True, exist_ok=True)
    have, failed = [], []
    for slug, name in sorted(wanted.items()):
        if name in missing:
            continue
        target = DEST / f"{slug}.jpg"
        if target.exists() and target.stat().st_size > 4096:
            have.append(slug)
            continue
        try:
            size = download(name, target)
        except Exception as err:
            failed.append((slug, err))
            print(f"  x {slug}: {err}")
            continue
        have.append(slug)
        print(f"  + {slug:24s} {size / 1024:6.0f} KB")

    write_manifest(have)
    print(f"\n{len(have)} images in {DEST}")
    print(f"manifest: {MANIFEST.relative_to(HERE.parent)}")
    if failed or missing:
        print(f"{len(failed) + len(missing)} card(s) will keep using the SVG face.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
