"""Personal-identity mechanics.

Tarot is stateless — the same 78 cards for everyone, drawn at random — so it has
no equivalent of a natal chart to hang personalisation on. This module builds the
two persistent objects that a tarot product *can* own:

  1. Birth cards, derived from a date. Traditional (Arrien / Greer) method, not
     invented for this site.
  2. A share codec, so a reading becomes a durable, linkable object instead of
     something that dies with the browser tab.

Both are deterministic. The same date always yields the same cards; the same
code always renders the same reading. Nothing here touches a model.
"""

from __future__ import annotations

import base64
from datetime import date

from tarot_data import CARDS, MAJOR_SLUGS, CARDS_BY_SLUG, SPREADS

# --------------------------------------------------------------------------
# Birth cards
# --------------------------------------------------------------------------

# The audience this is written for. Wide enough to be useful, narrow enough
# that a date page stays readable.
YEAR_RANGE = range(1940, 2021)

MONTHS = [
    ("january", "January", 31), ("february", "February", 29),
    ("march", "March", 31), ("april", "April", 30),
    ("may", "May", 31), ("june", "June", 30),
    ("july", "July", 31), ("august", "August", 31),
    ("september", "September", 30), ("october", "October", 31),
    ("november", "November", 30), ("december", "December", 31),
]
MONTH_INDEX = {slug: i + 1 for i, (slug, _, _) in enumerate(MONTHS)}
MONTH_NAME = {i + 1: name for i, (_, name, _) in enumerate(MONTHS)}
MONTH_DAYS = {i + 1: days for i, (_, _, days) in enumerate(MONTHS)}


def _digit_sum(n: int) -> int:
    return sum(int(c) for c in str(n))


def birth_cards(year: int, month: int, day: int):
    """Return (personality, soul) major-arcana records for a birth date.

    Method: add month + day + year, reduce by digit-sum until 22 or below
    (22 folds to The Fool). If the result is a two-digit number, its own
    digit-sum is the Soul card sitting beneath it; single digits are their own
    soul, which is why some people get one card and others get two.
    """
    total = month + day + year
    while total > 22:
        total = _digit_sum(total)
    if total == 22:
        total = 0

    personality_n = total
    soul_n = _digit_sum(personality_n) if personality_n > 9 else personality_n

    personality = CARDS_BY_SLUG[MAJOR_SLUGS[personality_n]]
    soul = CARDS_BY_SLUG[MAJOR_SLUGS[soul_n]]
    return personality, soul


def year_card(card_year: int, month: int, day: int):
    """The card governing one calendar year for this person — it moves annually."""
    total = month + day + card_year
    while total > 22:
        total = _digit_sum(total)
    if total == 22:
        total = 0
    return CARDS_BY_SLUG[MAJOR_SLUGS[total]]


def date_table(month: int, day: int):
    """Every year in range mapped to its birth card, grouped by card.

    This is what makes a date page worth indexing: the answer genuinely varies
    by year, so the page has real content rather than one repeated sentence.
    """
    groups = {}
    for y in YEAR_RANGE:
        personality, soul = birth_cards(y, month, day)
        key = (personality["slug"], soul["slug"])
        groups.setdefault(key, {
            "personality": personality,
            "soul": soul,
            "years": [],
        })["years"].append(y)

    out = sorted(groups.values(), key=lambda g: -len(g["years"]))
    for g in out:
        g["ranges"] = _condense(g["years"])
    return out


def _condense(years):
    """[1943,1944,1945,1952] -> ['1943–1945', '1952']"""
    out, start, prev = [], years[0], years[0]
    for y in years[1:]:
        if y == prev + 1:
            prev = y
            continue
        out.append(str(start) if start == prev else f"{start}–{prev}")
        start = prev = y
    out.append(str(start) if start == prev else f"{start}–{prev}")
    return out


def valid_date_slug(slug: str):
    """'may-15' -> (5, 15), or None."""
    if "-" not in slug:
        return None
    name, _, dd = slug.rpartition("-")
    month = MONTH_INDEX.get(name)
    if not month or not dd.isdigit():
        return None
    day = int(dd)
    if not 1 <= day <= MONTH_DAYS[month]:
        return None
    return month, day


def all_date_slugs():
    return [f"{slug}-{d}" for slug, _, days in MONTHS for d in range(1, days + 1)]


# --------------------------------------------------------------------------
# Share codec
#
# A reading is (spread, [(card, reversed)]). Packed one byte per card plus a
# leading spread byte, then base64url — a ten-card Celtic Cross fits in 15
# characters, short enough to paste anywhere without a shortener.
# --------------------------------------------------------------------------

_SPREAD_ORDER = list(SPREADS.keys())
_CARD_ORDER = [c["slug"] for c in CARDS]
_CARD_INDEX = {slug: i for i, slug in enumerate(_CARD_ORDER)}


def encode_reading(spread_slug: str, drawn) -> str:
    if spread_slug not in _SPREAD_ORDER:
        raise ValueError("unknown spread")
    payload = bytearray([_SPREAD_ORDER.index(spread_slug)])
    for item in drawn:
        idx = _CARD_INDEX[item["slug"]]
        payload.append(idx * 2 + (1 if item.get("reversed") else 0))
    return base64.urlsafe_b64encode(bytes(payload)).rstrip(b"=").decode()


def decode_reading(code: str):
    """Return (spread, drawn) or None. Never raises on hostile input."""
    if not code or len(code) > 32:
        return None
    try:
        pad = "=" * (-len(code) % 4)
        raw = base64.urlsafe_b64decode(code + pad)
    except Exception:
        return None
    if len(raw) < 2 or raw[0] >= len(_SPREAD_ORDER):
        return None

    spread = SPREADS[_SPREAD_ORDER[raw[0]]]
    if len(raw) - 1 != spread["count"]:
        return None

    drawn = []
    seen = set()
    for byte in raw[1:]:
        idx, rev = divmod(byte, 2)
        if idx >= len(_CARD_ORDER) or idx in seen:
            return None  # a deck cannot deal the same card twice
        seen.add(idx)
        drawn.append({"slug": _CARD_ORDER[idx], "reversed": bool(rev)})
    return spread, drawn


# --------------------------------------------------------------------------
# Daily card — deterministic per date, so it is stable across a day, across
# devices, and across a page refresh. A "card of the day" that changes when you
# reload is not a card of the day.
# --------------------------------------------------------------------------

def card_of_the_day(on: date | None = None):
    on = on or date.today()
    seed = on.toordinal() * 2654435761 % 2 ** 32
    card = CARDS[seed % len(CARDS)]
    return card, bool((seed // len(CARDS)) % 2)
