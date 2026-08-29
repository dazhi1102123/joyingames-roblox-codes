"""Original SVG card faces.

The deck is drawn rather than photographed: flat inks, black keylines, no
gradients — the look of a cheaply and beautifully printed 1909 deck. Drawing
them means zero licensing questions, files measured in kilobytes, and art that
picks up the page's theme tokens instead of fighting them.

Every colour resolves through a CSS custom property, so a card rendered on the
dark theme repaints itself without a second asset.
"""

from __future__ import annotations

W, H = 300, 520
CX = W / 2

INK = "var(--card-line)"
FACE = "var(--card-face)"

PALETTE = {
    "yellow": "var(--c-yellow)",
    "red": "var(--c-red)",
    "blue": "var(--c-blue)",
    "green": "var(--c-green)",
    "slate": "var(--c-slate)",
    "wands": "var(--c-red)",
    "cups": "var(--c-blue)",
    "swords": "var(--c-slate)",
    "pentacles": "var(--c-green)",
}


def _ink(key):
    return PALETTE.get(key, "var(--c-slate)")


# ---------------------------------------------------------------------------
# Suit glyphs. Each is drawn in a 40x40 box with its origin at the centre so
# the pip layouts can place them without per-glyph fudging.
# ---------------------------------------------------------------------------

def _glyph_wands(c):
    return (
        f'<path d="M0 -18 L0 18" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>'
        f'<path d="M0 -10 q-9 -3 -11 -12 q9 1 11 8" fill="{c}" stroke="{INK}" stroke-width="1.4"/>'
        f'<path d="M0 -2 q9 -3 11 -12 q-9 1 -11 8" fill="{c}" stroke="{INK}" stroke-width="1.4"/>'
    )


def _glyph_cups(c):
    return (
        f'<path d="M-11 -14 h22 a11 11 0 0 1 -22 0 z" fill="{c}" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round"/>'
        f'<path d="M0 -3 L0 10" stroke="{INK}" stroke-width="2.4"/>'
        f'<path d="M-9 14 h18" stroke="{INK}" stroke-width="2.6" stroke-linecap="round"/>'
        f'<circle cx="0" cy="-17" r="3" fill="none" stroke="{INK}" stroke-width="1.4"/>'
    )


def _glyph_swords(c):
    return (
        f'<path d="M0 -19 L4 -6 L4 10 L-4 10 L-4 -6 Z" fill="{c}" stroke="{INK}" stroke-width="1.5" stroke-linejoin="round"/>'
        f'<path d="M-11 11 h22" stroke="{INK}" stroke-width="2.6" stroke-linecap="round"/>'
        f'<path d="M0 11 L0 19" stroke="{INK}" stroke-width="2.6" stroke-linecap="round"/>'
    )


def _glyph_pentacles(c):
    star = "M0 -11 L2.6 -3.4 L10.5 -3.4 L4.1 1.3 L6.5 8.9 L0 4.2 L-6.5 8.9 L-4.1 1.3 L-10.5 -3.4 L-2.6 -3.4 Z"
    return (
        f'<circle cx="0" cy="0" r="16" fill="{c}" stroke="{INK}" stroke-width="1.8"/>'
        f'<path d="{star}" fill="none" stroke="{INK}" stroke-width="1.5" stroke-linejoin="round"/>'
    )


SUIT_GLYPHS = {
    "wands": _glyph_wands,
    "cups": _glyph_cups,
    "swords": _glyph_swords,
    "pentacles": _glyph_pentacles,
}

# Classic pip layouts, expressed as (x, y) offsets from the emblem centre.
PIP_LAYOUTS = {
    1: [(0, 0)],
    2: [(0, -46), (0, 46)],
    3: [(0, -56), (0, 0), (0, 56)],
    4: [(-40, -46), (40, -46), (-40, 46), (40, 46)],
    5: [(-40, -56), (40, -56), (0, 0), (-40, 56), (40, 56)],
    6: [(-40, -62), (40, -62), (-40, 0), (40, 0), (-40, 62), (40, 62)],
    7: [(-40, -66), (40, -66), (0, -33), (-40, 0), (40, 0), (-40, 66), (40, 66)],
    8: [(-40, -72), (40, -72), (-40, -24), (40, -24), (-40, 24), (40, 24), (-40, 72), (40, 72)],
    9: [(-42, -74), (42, -74), (-42, -26), (42, -26), (0, 0),
        (-42, 26), (42, 26), (-42, 74), (42, 74)],
    10: [(-42, -78), (42, -78), (0, -52), (-42, -30), (42, -30),
         (-42, 30), (42, 30), (0, 52), (-42, 78), (42, 78)],
}

COURT_DEVICE = {
    11: '<path d="M-20 16 L-20 -6 L-10 4 L0 -12 L10 4 L20 -6 L20 16 Z"',      # page: simple crown
    12: '<path d="M-22 16 L-22 -2 L-11 -14 L11 -14 L22 -2 L22 16 Z"',          # knight: helm
    13: '<path d="M-20 16 L-24 -14 L-10 -2 L0 -18 L10 -2 L24 -14 L20 16 Z"',   # queen: pointed crown
    14: '<path d="M-22 16 L-26 -16 L-13 -4 L0 -20 L13 -4 L26 -16 L22 16 Z"',   # king: taller crown
}


# ---------------------------------------------------------------------------
# Major arcana emblems. Each returns SVG drawn around the origin, roughly
# within a 150x170 box.
# ---------------------------------------------------------------------------

def _e_fool(c):
    return (
        f'<circle cx="-34" cy="-46" r="20" fill="{c}" stroke="{INK}" stroke-width="2"/>'
        f'<path d="M-70 46 L10 46 L58 78" fill="none" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>'
        f'<path d="M28 -6 L44 -52" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>'
        f'<circle cx="46" cy="-58" r="9" fill="none" stroke="{INK}" stroke-width="2"/>'
        f'<circle cx="0" cy="8" r="13" fill="none" stroke="{INK}" stroke-width="2"/>'
    )


def _e_magician(c):
    marks = ""
    for i, x in enumerate((-42, -14, 14, 42)):
        marks += f'<circle cx="{x}" cy="40" r="6" fill="{c if i % 2 == 0 else "none"}" stroke="{INK}" stroke-width="1.8"/>'
    return (
        f'<path d="M-26 -44 a13 13 0 1 1 26 0 a13 13 0 1 0 26 0 a13 13 0 1 1 -26 0 a13 13 0 1 0 -26 0 z" '
        f'fill="none" stroke="{c}" stroke-width="3"/>'
        f'<path d="M-60 20 h120" stroke="{INK}" stroke-width="2.5"/>'
        f'<path d="M0 -20 L0 16" stroke="{INK}" stroke-width="2.5"/>' + marks
    )


def _e_priestess(c):
    return (
        f'<rect x="-58" y="-56" width="20" height="112" fill="{INK}"/>'
        f'<rect x="38" y="-56" width="20" height="112" fill="none" stroke="{INK}" stroke-width="2.5"/>'
        f'<path d="M4 -34 a30 30 0 1 0 0 60 a24 24 0 1 1 0 -60 z" fill="{c}" stroke="{INK}" stroke-width="2"/>'
    )


def _e_empress(c):
    petals = ""
    for a in range(0, 360, 45):
        petals += (f'<ellipse cx="0" cy="-34" rx="10" ry="22" fill="{c}" stroke="{INK}" '
                   f'stroke-width="1.6" transform="rotate({a})"/>')
    return (
        f'<g>{petals}</g>'
        f'<circle cx="0" cy="0" r="12" fill="{FACE}" stroke="{INK}" stroke-width="2"/>'
        f'<path d="M0 52 L0 76" stroke="{INK}" stroke-width="2.5"/>'
    )


def _e_emperor(c):
    return (
        f'<rect x="-44" y="-20" width="88" height="76" fill="{c}" stroke="{INK}" stroke-width="2.2"/>'
        f'<path d="M-44 -20 L-44 -56 M44 -20 L44 -56" stroke="{INK}" stroke-width="2.2"/>'
        f'<path d="M-44 -56 q-18 -6 -14 -24 q12 6 14 18" fill="none" stroke="{INK}" stroke-width="2.2"/>'
        f'<path d="M44 -56 q18 -6 14 -24 q-12 6 -14 18" fill="none" stroke="{INK}" stroke-width="2.2"/>'
        f'<path d="M-20 56 L-20 20 L20 20 L20 56" fill="{FACE}" stroke="{INK}" stroke-width="2"/>'
    )


def _e_hierophant(c):
    arcs = ""
    for i, r in enumerate((34, 24, 14)):
        arcs += (f'<path d="M-{r} {-14 + i * 18} a{r} {r} 0 0 1 {r * 2} 0" fill="{c if i == 1 else FACE}" '
                 f'stroke="{INK}" stroke-width="2"/>')
    return (
        arcs +
        f'<path d="M-26 44 L26 78 M26 44 L-26 78" stroke="{INK}" stroke-width="2.4" stroke-linecap="round"/>'
        f'<circle cx="-26" cy="44" r="6" fill="none" stroke="{INK}" stroke-width="2"/>'
        f'<circle cx="26" cy="44" r="6" fill="none" stroke="{INK}" stroke-width="2"/>'
    )


def _e_lovers(c):
    return (
        f'<circle cx="-40" cy="-52" r="18" fill="none" stroke="{c}" stroke-width="3"/>'
        f'<circle cx="40" cy="-52" r="18" fill="none" stroke="{c}" stroke-width="3"/>'
        f'<circle cx="-22" cy="24" r="34" fill="none" stroke="{INK}" stroke-width="2.2"/>'
        f'<circle cx="22" cy="24" r="34" fill="none" stroke="{INK}" stroke-width="2.2"/>'
    )


def _e_chariot(c):
    return (
        f'<rect x="-46" y="-8" width="92" height="52" fill="{c}" stroke="{INK}" stroke-width="2.2"/>'
        f'<path d="M-52 -8 L0 -54 L52 -8" fill="none" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>'
        f'<path d="M0 -40 L4 -30 L14 -30 L6 -24 L9 -14 L0 -20 L-9 -14 L-6 -24 L-14 -30 L-4 -30 Z" fill="{INK}"/>'
        f'<circle cx="-30" cy="58" r="14" fill="none" stroke="{INK}" stroke-width="2.4"/>'
        f'<circle cx="30" cy="58" r="14" fill="none" stroke="{INK}" stroke-width="2.4"/>'
    )


def _e_strength(c):
    return (
        f'<path d="M-26 -46 a13 13 0 1 1 26 0 a13 13 0 1 0 26 0 a13 13 0 1 1 -26 0 a13 13 0 1 0 -26 0 z" '
        f'fill="none" stroke="{INK}" stroke-width="2.6"/>'
        f'<circle cx="0" cy="26" r="34" fill="{c}" stroke="{INK}" stroke-width="2.2"/>'
        f'<path d="M-16 18 q16 16 32 0" fill="none" stroke="{INK}" stroke-width="2.4" stroke-linecap="round"/>'
        f'<circle cx="-13" cy="12" r="3" fill="{INK}"/><circle cx="13" cy="12" r="3" fill="{INK}"/>'
    )


def _e_hermit(c):
    return (
        f'<path d="M38 -56 L38 74" stroke="{INK}" stroke-width="2.6" stroke-linecap="round"/>'
        f'<path d="M-46 -30 L-14 -30 L-4 -8 L-4 40 L-56 40 L-56 -8 Z" fill="{c}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>'
        f'<path d="M-30 -2 L-26 8 L-16 8 L-24 15 L-21 25 L-30 19 L-39 25 L-36 15 L-44 8 L-34 8 Z" fill="{FACE}" stroke="{INK}" stroke-width="1.4"/>'
    )


def _e_wheel(c):
    spokes = ""
    for a in range(0, 360, 45):
        spokes += f'<path d="M0 -44 L0 44" stroke="{INK}" stroke-width="2" transform="rotate({a})"/>'
    return (
        f'<circle cx="0" cy="0" r="52" fill="{c}" stroke="{INK}" stroke-width="2.4"/>'
        f'<circle cx="0" cy="0" r="44" fill="none" stroke="{INK}" stroke-width="1.6"/>'
        + spokes +
        f'<circle cx="0" cy="0" r="12" fill="{FACE}" stroke="{INK}" stroke-width="2.2"/>'
    )


def _e_justice(c):
    return (
        f'<path d="M0 -56 L0 60" stroke="{INK}" stroke-width="2.6"/>'
        f'<path d="M-52 -34 h104" stroke="{INK}" stroke-width="2.6" stroke-linecap="round"/>'
        f'<path d="M-52 -34 L-68 4 h32 z" fill="{c}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
        f'<path d="M52 -34 L36 4 h32 z" fill="{c}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
        f'<path d="M-18 60 h36" stroke="{INK}" stroke-width="2.6" stroke-linecap="round"/>'
    )


def _e_hanged(c):
    return (
        f'<path d="M-56 -58 h112" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>'
        f'<path d="M0 -58 L0 -22" stroke="{INK}" stroke-width="2.4"/>'
        f'<circle cx="0" cy="-8" r="14" fill="{c}" stroke="{INK}" stroke-width="2.2"/>'
        f'<path d="M0 6 L0 40 M0 40 L-24 66 M0 40 L26 30" fill="none" stroke="{INK}" stroke-width="2.4" stroke-linecap="round"/>'
    )


def _e_death(c):
    return (
        f'<path d="M-46 62 L46 -50" stroke="{INK}" stroke-width="2.8" stroke-linecap="round"/>'
        f'<path d="M46 -50 q-36 -14 -58 8 q34 -2 58 -8 z" fill="{c}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
        f'<circle cx="26" cy="46" r="18" fill="none" stroke="{INK}" stroke-width="2.2"/>'
        f'<circle cx="26" cy="46" r="8" fill="{c}" stroke="{INK}" stroke-width="1.6"/>'
    )


def _e_temperance(c):
    return (
        f'<path d="M0 -76 L24 -44 L-24 -44 Z" fill="none" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>'
        f'<path d="M-56 -30 h30 l-5 26 h-20 z" fill="{c}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
        f'<path d="M-51 -4 v12 h20 v-12" fill="none" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
        f'<path d="M26 18 h30 l-5 26 h-20 z" fill="{c}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
        f'<path d="M31 44 v12 h20 v-12" fill="none" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
        f'<path d="M-31 -22 q34 6 42 40" fill="none" stroke="{c}" stroke-width="4" stroke-linecap="round"/>'
        f'<path d="M-31 -22 q34 6 42 40" fill="none" stroke="{INK}" stroke-width="1.4" stroke-linecap="round"/>'
    )


def _e_devil(c):
    star = "M0 30 L14 -12 L-22 14 L22 14 L-14 -12 Z"
    return (
        f'<path d="{star}" fill="none" stroke="{c}" stroke-width="3" stroke-linejoin="round"/>'
        f'<circle cx="0" cy="6" r="42" fill="none" stroke="{INK}" stroke-width="2.2"/>'
        f'<ellipse cx="-44" cy="62" rx="13" ry="9" fill="none" stroke="{INK}" stroke-width="2.4"/>'
        f'<ellipse cx="-22" cy="62" rx="13" ry="9" fill="none" stroke="{INK}" stroke-width="2.4"/>'
        f'<ellipse cx="22" cy="62" rx="13" ry="9" fill="none" stroke="{INK}" stroke-width="2.4"/>'
        f'<ellipse cx="44" cy="62" rx="13" ry="9" fill="none" stroke="{INK}" stroke-width="2.4"/>'
    )


def _e_tower(c):
    return (
        f'<path d="M-30 70 L-24 -20 L24 -20 L30 70 Z" fill="{c}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>'
        f'<path d="M-34 -34 L34 -34 L28 -20 L-28 -20 Z" fill="{FACE}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>'
        f'<path d="M-38 -52 L38 -52 L30 -38 L-30 -38 Z" fill="{INK}" transform="rotate(-8)"/>'
        f'<path d="M52 -66 L28 -18 L46 -18 L20 34" fill="none" stroke="{INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>'
        f'<rect x="-8" y="6" width="16" height="24" fill="{FACE}" stroke="{INK}" stroke-width="1.8"/>'
    )


def _e_star(c):
    def s(cx, cy, r):
        pts = []
        import math
        for i in range(16):
            rad = r if i % 2 == 0 else r * 0.38
            a = math.pi * 2 * i / 16 - math.pi / 2
            pts.append(f"{cx + rad * math.cos(a):.1f} {cy + rad * math.sin(a):.1f}")
        return "M" + " L".join(pts) + " Z"
    small = ""
    for cx, cy in ((-52, -34), (52, -34), (-38, 14), (38, 14)):
        small += f'<path d="{s(cx, cy, 13)}" fill="none" stroke="{INK}" stroke-width="1.6"/>'
    return (
        f'<path d="{s(0, -30, 40)}" fill="{c}" stroke="{INK}" stroke-width="2"/>' + small +
        f'<path d="M-56 54 q28 -12 56 0 q28 12 56 0" fill="none" stroke="{INK}" stroke-width="2.2" transform="translate(-28 0)"/>'
        f'<path d="M-56 70 q28 -12 56 0 q28 12 56 0" fill="none" stroke="{INK}" stroke-width="2.2" transform="translate(-28 0)"/>'
    )


def _e_moon(c):
    return (
        f'<circle cx="0" cy="-16" r="44" fill="{c}" stroke="{INK}" stroke-width="2.2"/>'
        f'<path d="M14 -56 a44 44 0 1 0 0 80 a34 34 0 1 1 0 -80 z" fill="{FACE}" stroke="{INK}" stroke-width="2"/>'
        f'<path d="M-58 74 L-58 30 L-44 16 L-30 30 L-30 74 Z" fill="none" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>'
        f'<path d="M30 74 L30 30 L44 16 L58 30 L58 74 Z" fill="none" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>'
    )


def _e_sun(c):
    rays = ""
    for a in range(0, 360, 30):
        rays += (f'<path d="M0 -44 L0 -66" stroke="{INK}" stroke-width="2.6" '
                 f'stroke-linecap="round" transform="rotate({a})"/>')
    return (
        rays +
        f'<circle cx="0" cy="0" r="38" fill="{c}" stroke="{INK}" stroke-width="2.4"/>'
        f'<circle cx="-13" cy="-6" r="3.4" fill="{INK}"/><circle cx="13" cy="-6" r="3.4" fill="{INK}"/>'
        f'<path d="M-15 12 q15 14 30 0" fill="none" stroke="{INK}" stroke-width="2.4" stroke-linecap="round"/>'
    )


def _e_judgement(c):
    return (
        f'<path d="M-58 -44 L34 -20 L34 4 L-58 -20 Z" fill="{c}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>'
        f'<path d="M34 -30 L58 -38 L58 14 L34 6 Z" fill="{FACE}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>'
        f'<path d="M-52 34 q52 -18 104 0" fill="none" stroke="{INK}" stroke-width="2.2"/>'
        f'<path d="M-44 52 q44 -16 88 0" fill="none" stroke="{INK}" stroke-width="2.2"/>'
        f'<path d="M-34 70 q34 -14 68 0" fill="none" stroke="{INK}" stroke-width="2.2"/>'
    )


def _e_world(c):
    marks = ""
    for cx, cy in ((-56, -62), (56, -62), (-56, 62), (56, 62)):
        marks += f'<circle cx="{cx}" cy="{cy}" r="9" fill="{INK}"/>'
    return (
        f'<ellipse cx="0" cy="0" rx="46" ry="66" fill="none" stroke="{c}" stroke-width="7"/>'
        f'<ellipse cx="0" cy="0" rx="46" ry="66" fill="none" stroke="{INK}" stroke-width="2"/>'
        f'<path d="M0 -34 L0 22 M-20 -8 L0 22 L20 -8" fill="none" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>'
        + marks
    )


MAJOR_EMBLEMS = {
    "fool": _e_fool, "magician": _e_magician, "priestess": _e_priestess,
    "empress": _e_empress, "emperor": _e_emperor, "hierophant": _e_hierophant,
    "lovers": _e_lovers, "chariot": _e_chariot, "strength": _e_strength,
    "hermit": _e_hermit, "wheel": _e_wheel, "justice": _e_justice,
    "hanged": _e_hanged, "death": _e_death, "temperance": _e_temperance,
    "devil": _e_devil, "tower": _e_tower, "star": _e_star, "moon": _e_moon,
    "sun": _e_sun, "judgement": _e_judgement, "world": _e_world,
}


# ---------------------------------------------------------------------------
# Composition
# ---------------------------------------------------------------------------

def _emblem(card):
    colour = _ink(card["ink"])
    if card["arcana"] == "major":
        draw = MAJOR_EMBLEMS[card["emblem"]]
        return f'<g transform="translate({CX} 252) scale(1.46)">{draw(colour)}</g>'

    suit = card["suit"]
    glyph = SUIT_GLYPHS[suit]
    rank = card["number"]

    if rank in COURT_DEVICE:
        device = COURT_DEVICE[rank] + f' fill="{colour}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>'
        return (
            f'<g transform="translate({CX} 196) scale(1.5)">{device}</g>'
            f'<g transform="translate({CX} 312) scale(2.7)">{glyph(colour)}</g>'
        )

    scale = 1.0 if rank <= 3 else (0.86 if rank <= 6 else 0.72)
    pips = "".join(
        f'<g transform="translate({x} {y}) scale({scale})">{glyph(colour)}</g>'
        for x, y in PIP_LAYOUTS[rank]
    )
    return f'<g transform="translate({CX} 252) scale(1.42)">{pips}</g>'


def _name_size(name):
    n = len(name)
    if n <= 12:
        return 21
    if n <= 17:
        return 18
    if n <= 21:
        return 16
    return 14


def card_svg(card, is_reversed=False, extra_class=""):
    """Render one card face. `is_reversed` turns the whole face, as a real deck does."""
    name = card["name"].upper()
    label = card["roman"]
    rotate = ' transform="rotate(180 150 260)"' if is_reversed else ""
    cls = f"cardface {extra_class}".strip()

    return (
        f'<svg class="{cls}" viewBox="0 0 {W} {H}" role="img" '
        f'aria-label="{card["name"]}{" reversed" if is_reversed else ""}" '
        f'xmlns="http://www.w3.org/2000/svg">'
        f'<rect x="1.5" y="1.5" width="{W - 3}" height="{H - 3}" rx="9" fill="{FACE}" '
        f'stroke="{INK}" stroke-width="3"/>'
        f'<rect x="12" y="12" width="{W - 24}" height="{H - 24}" rx="4" fill="none" '
        f'stroke="{INK}" stroke-width="1.4" opacity="0.55"/>'
        f'<g{rotate}>'
        f'<text class="cardface-num" x="{CX}" y="62" text-anchor="middle" fill="{INK}">{label}</text>'
        f'<path d="M108 78 h84" stroke="{INK}" stroke-width="1.2" opacity="0.5"/>'
        f'{_emblem(card)}'
        f'<path d="M40 434 h220" stroke="{INK}" stroke-width="1.2" opacity="0.5"/>'
        f'<text class="cardface-name" x="{CX}" y="470" text-anchor="middle" fill="{INK}" '
        f'font-size="{_name_size(name)}">{name}</text>'
        f'</g>'
        f'</svg>'
    )


def card_back_svg(extra_class=""):
    """The back of the deck: a lattice that reads at any size."""
    lattice = ""
    for i in range(-2, 9):
        lattice += f'<path d="M{i * 40 - 40} 40 L{i * 40 + 200} 480" stroke="{INK}" stroke-width="1" opacity="0.32"/>'
        lattice += f'<path d="M{i * 40 - 40} 480 L{i * 40 + 200} 40" stroke="{INK}" stroke-width="1" opacity="0.32"/>'
    return (
        f'<svg class="cardface cardback {extra_class}" viewBox="0 0 {W} {H}" aria-hidden="true" '
        f'xmlns="http://www.w3.org/2000/svg">'
        f'<rect x="1.5" y="1.5" width="{W - 3}" height="{H - 3}" rx="9" fill="var(--c-blue)" '
        f'stroke="{INK}" stroke-width="3"/>'
        f'<clipPath id="cb"><rect x="16" y="16" width="{W - 32}" height="{H - 32}" rx="4"/></clipPath>'
        f'<g clip-path="url(#cb)">{lattice}</g>'
        f'<rect x="16" y="16" width="{W - 32}" height="{H - 32}" rx="4" fill="none" '
        f'stroke="{INK}" stroke-width="1.6" opacity="0.7"/>'
        f'<circle cx="{CX}" cy="260" r="34" fill="var(--c-yellow)" stroke="{INK}" stroke-width="2.4"/>'
        f'<circle cx="{CX}" cy="260" r="22" fill="none" stroke="{INK}" stroke-width="1.6"/>'
        f'</svg>'
    )
