# Card artwork

The 78 images in this directory are the Rider-Waite-Smith tarot deck,
published in 1909 by William Rider & Son, conceived by A. E. Waite and drawn
by **Pamela Colman Smith (1878–1951)**.

## Copyright

| | |
|---|---|
| First publication | 1909 |
| Illustrator | Pamela Colman Smith, died 1951 |
| United States | Public domain — published before 1929 |
| EU / Germany | Public domain — life of the author + 70 years, expired 1 January 2022 |

These are the **original 1909 plates**, not the 1971 U.S. Games recolouring,
which may carry its own claim as a derivative work.

`Rider-Waite®` is a trademark of U.S. Games Systems. The images are free to
use; the name is not free to brand with. This site does not use it.

This is a reading of the facts, not legal advice. A commercial operator should
confirm it with counsel for their own jurisdiction.

## Format

Encoded as WebP at quality 88 from the source scans — flat-ink lithographs
compress to roughly a sixth of the PNG size with no visible difference at the
sizes rendered here (21.9 MB → 3.4 MB across the deck).

Regenerate from a directory of source scans with:

```bash
python web/import_rws.py <image-directory>
```

That script also writes `packages/core/src/art.manifest.ts`, which is what the
site reads to decide, per card, whether a real scan exists or the drawn SVG
face should be used instead.
