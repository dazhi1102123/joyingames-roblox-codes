#!/usr/bin/env python3
"""Seed the roster with example readers, for development.

Run once against a fresh database:

    python seed_readers.py

It prints each reader's access key. That key is the whole credential for the
desk — hand it over out of band and rotate it by re-issuing the reader.
"""

import sys

import store


EXAMPLES = [
    dict(
        slug="maren-voss", name="Maren Voss",
        tagline="Direct, unsentimental, and fast.",
        bio="Fifteen years reading, most of it for people facing a decision they have "
            "already half made. Writes short and does not soften the difficult card.",
        approach="Position first, card second. Reads the shape of the spread before any "
                 "single card, and will tell you when the cards are describing something "
                 "other than what you asked about.",
        specialties=["decisions", "work", "endings"],
        price_cents=4500, turnaround_h=24, capacity=6,
    ),
    dict(
        slug="ines-caldeira", name="Inês Caldeira",
        tagline="Slow, careful, and good with the tangled ones.",
        bio="Comes to tarot from a counselling background and reads accordingly — more "
            "interested in the question under the question than in prediction.",
        approach="Works mostly with relationship and family spreads. Will often reframe "
                 "the question before answering it, and says so when she does.",
        specialties=["relationships", "family", "grief"],
        price_cents=5500, turnaround_h=48, capacity=4,
    ),
    dict(
        slug="theo-brandt", name="Theo Brandt",
        tagline="Practical readings for practical problems.",
        bio="Reads for people who want a next action, not a mood. Keeps the mysticism "
            "to a minimum and the specifics high.",
        approach="Heavy on the minor arcana and what they say about the ordinary "
                 "mechanics of a situation. Ends every reading with one concrete thing "
                 "to try.",
        specialties=["money", "work", "planning"],
        price_cents=3500, turnaround_h=48, capacity=8,
    ),
]


def main():
    store.init_db()
    for spec in EXAMPLES:
        if store.get_reader(spec["slug"]):
            print(f"  = {spec['slug']} already exists, skipped")
            continue
        store.add_reader(**spec)
        reader = store.get_reader(spec["slug"])
        print(f"  + {reader['name']:<18} €{reader['price']} → €{reader['payout']} "
              f"to reader (margin €{reader['margin']})")
        print(f"    {'':<18} /desk key: {reader['access_key']}")
    print("\nKeep these keys out of version control. Rotate by re-issuing the reader.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
