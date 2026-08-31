"""Colour, stone and metal for every card.

A daily brief needs something concrete to say beyond the card itself, and a
physical product needs a defensible reason to be attached to a reading. Both
come from correspondences — the traditional mapping of cards to planets, signs
and elements, and of those in turn to colours and stones.

These are derived, not invented per card: majors inherit from their planetary or
zodiacal attribution, minors from their suit's element with the rank shifting the
shade. That means the associations are checkable against the tradition rather
than being decoration.

**A boundary that is load-bearing, legally and editorially.** Everything here
describes an association. Nothing here is a claim that a colour or a stone
changes an outcome, affects health, or attracts money. Copy generated from this
module must stay on the descriptive side of that line — see `SAFE_FRAMING`.
"""

from __future__ import annotations

from tarot_data import CARDS_BY_SLUG, SUITS

SAFE_FRAMING = (
    "Correspondences are traditional associations, not remedies. Say 'the stone "
    "associated with this card', never 'wear this to attract' or 'this will "
    "protect you from'."
)

# --------------------------------------------------------------------------
# Majors inherit from their attribution. Colours are the traditional ones for
# each planet or sign; stones follow the same lineage.
# --------------------------------------------------------------------------

ASTRO = {
    "Uranus":      ("Electric Blue", "#3C6FD1", "Labradorite", "Platinum"),
    "Mercury":     ("Citrine Yellow", "#D9A521", "Citrine", "Quicksilver"),
    "Moon":        ("Pearl White", "#DDD8C8", "Moonstone", "Silver"),
    "Venus":       ("Verdant Green", "#5F7F55", "Rose Quartz", "Copper"),
    "Aries":       ("Scarlet", "#B4442F", "Carnelian", "Iron"),
    "Taurus":      ("Moss Green", "#6E7F4F", "Emerald", "Copper"),
    "Gemini":      ("Pale Straw", "#D8C97E", "Agate", "Quicksilver"),
    "Cancer":      ("Silver Grey", "#A9B2B8", "Pearl", "Silver"),
    "Leo":         ("Gold", "#D9A521", "Tiger's Eye", "Gold"),
    "Virgo":       ("Slate Navy", "#4A5568", "Peridot", "Quicksilver"),
    "Jupiter":     ("Royal Blue", "#3D6390", "Lapis Lazuli", "Tin"),
    "Libra":       ("Dusty Rose", "#C08A8A", "Jade", "Copper"),
    "Neptune":     ("Sea Green", "#5B8C86", "Aquamarine", "Platinum"),
    "Scorpio":     ("Deep Crimson", "#8A2B33", "Obsidian", "Iron"),
    "Sagittarius": ("Burnt Orange", "#C4763A", "Turquoise", "Tin"),
    "Capricorn":   ("Charcoal", "#40423F", "Onyx", "Lead"),
    "Mars":        ("Ember Red", "#A8352A", "Red Jasper", "Iron"),
    "Aquarius":    ("Ice Blue", "#7FA3C4", "Amethyst", "Platinum"),
    "Pisces":      ("Sea Foam", "#7FA396", "Amethyst", "Tin"),
    "Sun":         ("Sun Gold", "#E0AD2A", "Sunstone", "Gold"),
    "Pluto":       ("Void Black", "#2A2724", "Black Tourmaline", "Lead"),
    "Saturn":      ("Indigo", "#3B3F63", "Jet", "Lead"),
}

# --------------------------------------------------------------------------
# Minors take their suit's element and shift shade with rank, so a suit of
# fourteen cards does not resolve to fourteen identical swatches.
# --------------------------------------------------------------------------

# Buckets keyed by rank: (low, high) inclusive.
_RAMP = {
    "wands": [
        ((1, 1),   ("Kindling Amber", "#E3A33C", "Carnelian")),
        ((2, 3),   ("Copper Flame", "#C4763A", "Sunstone")),
        ((4, 5),   ("Scarlet", "#B4442F", "Red Jasper")),
        ((6, 7),   ("Ember Red", "#A8352A", "Garnet")),
        ((8, 9),   ("Rust", "#8F4A2E", "Tiger's Eye")),
        ((10, 10), ("Burnt Umber", "#6E3B26", "Smoky Quartz")),
        ((11, 12), ("Bright Ochre", "#D18B2C", "Amber")),
        ((13, 14), ("Deep Gold", "#B8842A", "Citrine")),
    ],
    "cups": [
        ((1, 1),   ("Spring Water", "#8FB6C9", "Moonstone")),
        ((2, 3),   ("Cornflower", "#5F87B8", "Aquamarine")),
        ((4, 5),   ("Slate Blue", "#4A6E92", "Sodalite")),
        ((6, 7),   ("Royal Blue", "#3D6390", "Lapis Lazuli")),
        ((8, 9),   ("Deep Sea", "#2E4F70", "Blue Lace Agate")),
        ((10, 10), ("Midnight Blue", "#25405C", "Sapphire")),
        ((11, 12), ("Pale Aqua", "#7FA9AE", "Chalcedony")),
        ((13, 14), ("Teal", "#3E6E74", "Larimar")),
    ],
    "swords": [
        ((1, 1),   ("Clear Silver", "#C2C7CB", "Clear Quartz")),
        ((2, 3),   ("Ash Grey", "#9AA0A6", "Howlite")),
        ((4, 5),   ("Slate", "#6B7078", "Hematite")),
        ((6, 7),   ("Storm Grey", "#585E66", "Fluorite")),
        ((8, 9),   ("Iron Grey", "#474C54", "Obsidian")),
        ((10, 10), ("Charcoal", "#3A3E44", "Black Tourmaline")),
        ((11, 12), ("Pale Sky", "#A8BCCB", "Selenite")),
        ((13, 14), ("Steel Blue", "#5D7488", "Kyanite")),
    ],
    "pentacles": [
        ((1, 1),   ("New Leaf", "#8AA86F", "Green Aventurine")),
        ((2, 3),   ("Sage", "#7E9470", "Jade")),
        ((4, 5),   ("Moss Green", "#5F7F55", "Malachite")),
        ((6, 7),   ("Forest", "#4C6B45", "Moss Agate")),
        ((8, 9),   ("Olive", "#6B7040", "Peridot")),
        ((10, 10), ("Deep Loam", "#4F4A34", "Tiger Iron")),
        ((11, 12), ("Wheat", "#B9A56E", "Yellow Jasper")),
        ((13, 14), ("Bronze", "#8A6F3C", "Pyrite")),
    ],
}

SUIT_METAL = {"wands": "Iron", "cups": "Silver", "swords": "Tin", "pentacles": "Copper"}


def correspondence(card):
    """Colour, stone and metal for one card."""
    if card["arcana"] == "major":
        name, hexv, stone, metal = ASTRO[card["astrology"]]
        source = f"{card['astrology']}, its traditional attribution"
    else:
        rank = card["number"]
        for (lo, hi), (name, hexv, stone) in _RAMP[card["suit"]]:
            if lo <= rank <= hi:
                break
        metal = SUIT_METAL[card["suit"]]
        source = f"{SUITS[card['suit']]['name']} and the element {card['element']}"

    return {
        "colour": name,
        "hex": hexv,
        "stone": stone,
        "metal": metal,
        "source": source,
    }


# --------------------------------------------------------------------------
# "What to watch" — the card's own shadow, not a warning invented for effect.
#
# A card's reversed keywords are exactly the failure mode of its upright
# meaning, which makes them the honest source for a caution line. Nothing here
# predicts an event.
# --------------------------------------------------------------------------

_WATCH_OPENERS = [
    "Worth watching:",
    "The failure mode here:",
    "Where this tends to go wrong:",
    "The thing to catch early:",
]


def watch_line(card, is_reversed=False, variant=0):
    """One sentence on the card's shadow, phrased as observation not prophecy."""
    opener = _WATCH_OPENERS[variant % len(_WATCH_OPENERS)]
    if is_reversed:
        return (
            f"{opener} {card['name']} is already reversed, so the shadow is the "
            f"surface — {', '.join(card['rev_keys'][:2])}. Read it as a description "
            f"of where you are, not a forecast of where you are going."
        )
    return (
        f"{opener} every card has a way of curdling, and this one curdles into "
        f"{', '.join(card['rev_keys'][:2])}. Noticing that early is the whole use "
        f"of knowing it."
    )


def brief_for(card, is_reversed=False, variant=0):
    """Everything a daily brief needs about one card, in one call."""
    c = correspondence(card)
    return {
        "card": card,
        "reversed": is_reversed,
        "colour": c["colour"],
        "hex": c["hex"],
        "stone": c["stone"],
        "metal": c["metal"],
        "source": c["source"],
        "watch": watch_line(card, is_reversed, variant),
        "keywords": (card["rev_keys"] if is_reversed else card["up_keys"])[:3],
        "body": card["rev"] if is_reversed else card["up"],
    }
