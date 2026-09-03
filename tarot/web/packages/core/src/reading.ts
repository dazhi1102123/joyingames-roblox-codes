/** The reading engine: draw cards, then say something true about the spread.
 *
 * Ported from tarot/app.py. It stays free of React and Node built-ins so the
 * same code runs in a server component, in a browser, and in React Native.
 */

import { CARDS, SPREADS, SUITS } from "./data.generated"
import type { Card, DrawnCard, Reading, Spread, SuitSlug } from "./types"

const BY_SLUG = new Map(CARDS.map((c) => [c.slug, c]))

export function cardBySlug(slug: string): Card | undefined {
  return BY_SLUG.get(slug)
}

export function spreadBySlug(slug: string): Spread | undefined {
  return SPREADS[slug]
}

// --------------------------------------------------------------------------
// Drawing
// --------------------------------------------------------------------------

/** A uniform integer in [0, max) from the platform CSPRNG.
 *
 * The shuffle is the one mechanic users are entitled to be suspicious about,
 * so it uses crypto, not Math.random, and the site says so on the page.
 * Rejection sampling keeps it uniform -- taking a modulus of a 32-bit draw
 * would quietly bias the low indices.
 */
function randomBelow(max: number): number {
  if (max <= 0) throw new RangeError("randomBelow needs a positive bound")
  const limit = Math.floor(0xffffffff / max) * max
  const buf = new Uint32Array(1)
  let value: number
  do {
    crypto.getRandomValues(buf)
    value = buf[0]
  } while (value >= limit)
  return value % max
}

export interface DrawSpec {
  slug: string
  reversed: boolean
}

/** Draw without replacement. */
export function drawCards(count: number, allowReversed = true): DrawSpec[] {
  const deck = [...CARDS]
  const drawn: DrawSpec[] = []
  for (let i = 0; i < count; i++) {
    const card = deck.splice(randomBelow(deck.length), 1)[0]
    drawn.push({
      slug: card.slug,
      reversed: allowReversed ? randomBelow(2) === 1 : false,
    })
  }
  return drawn
}

/** Attach the full card record and the spread position to each draw. */
export function hydrate(drawn: DrawSpec[], spread: Spread): DrawnCard[] {
  return drawn.map((entry, i) => {
    const card = BY_SLUG.get(entry.slug)
    if (!card) throw new Error(`unknown card: ${entry.slug}`)
    return {
      card,
      reversed: entry.reversed,
      position: spread.positions[i] ?? { name: `Card ${i + 1}`, note: "" },
    }
  })
}

// --------------------------------------------------------------------------
// Composing
// --------------------------------------------------------------------------

export function composeReading(
  cards: DrawnCard[],
  spread: Spread,
  question = "",
): Reading {
  const passages: string[] = []

  if (question) {
    passages.push(
      `You asked: *${question}* — here is what the ${spread.name.toLowerCase()} turned up.`,
    )
  }

  for (const entry of cards) {
    const { card, reversed } = entry
    const keys = reversed ? card.rev_keys : card.up_keys
    const body = reversed ? card.rev : card.up
    const orient = reversed ? "reversed" : "upright"
    passages.push(
      `**${entry.position.name} — ${card.name}, ${orient}.** ` +
        `${entry.position.note} ${body} ` +
        `The threads to hold: ${keys.slice(0, 3).join(", ")}.`,
    )
  }

  const synthesis = synthesise(cards, spread)
  passages.push(synthesis)
  return { spread, question, cards, passages, synthesis }
}

const FLIPPED: Record<string, string> = { yes: "maybe", maybe: "no", no: "maybe" }

const VERDICT: Record<string, string> = {
  yes: "Yes — and the card is not hedging.",
  maybe: "Not yet. The situation is still forming.",
  no: "No, or not on these terms.",
}

/** The part that makes a spread more than a list of cards. */
function synthesise(cards: DrawnCard[], spread: Spread): string {
  if (spread.slug === "yes-no") {
    const { card, reversed } = cards[0]
    const lean = reversed ? FLIPPED[card.yesno] : card.yesno
    return (
      `**The answer.** ${VERDICT[lean]} ${card.name} carries that direction ` +
      `because it is about ${card.up_keys[0]}, and that is the axis your ` +
      `question turns on.`
    )
  }

  const majors = cards.filter((c) => c.card.arcana === "major")
  const reversals = cards.filter((c) => c.reversed)
  const suits = cards.map((c) => c.card.suit).filter((s): s is SuitSlug => !!s)

  const bits: string[] = []

  if (majors.length >= Math.max(2, Math.floor(cards.length / 2))) {
    bits.push(
      `${majors.length} of ${cards.length} cards are major arcana, which reads ` +
        "as a situation larger than day-to-day management — the forces here are " +
        "structural, not tactical.",
    )
  } else if (majors.length === 0) {
    bits.push(
      "No major arcana in this spread. That is good news: this is a practical " +
        "situation with practical levers, not a fated one.",
    )
  }

  if (suits.length) {
    const counts = new Map<string, number>()
    for (const s of suits) counts.set(s, (counts.get(s) ?? 0) + 1)
    // Ties resolve to the first suit encountered, matching Python's max().
    let dominant: SuitSlug = suits[0]
    for (const s of suits) {
      if ((counts.get(s) ?? 0) > (counts.get(dominant) ?? 0)) dominant = s
    }
    if ((counts.get(dominant) ?? 0) >= Math.max(2, Math.floor(suits.length / 2) + 1)) {
      const s = SUITS[dominant]
      bits.push(
        `${s.name} dominate, so the centre of gravity is ${s.domain}. ` +
          "Solutions from a different register will slide off.",
      )
    }
  }

  if (reversals.length >= Math.max(2, Math.floor((cards.length * 2) / 3))) {
    bits.push(
      "Most of the spread is reversed. That usually means the energy is present " +
        "but blocked, internalised or badly timed — rarely that it is absent.",
    )
  } else if (reversals.length === 0 && cards.length > 1) {
    bits.push(
      "Nothing is reversed. What the cards describe is moving openly and outwardly.",
    )
  }

  if (!bits.length) {
    bits.push(
      "The spread is mixed, which is the ordinary case: no single force is " +
        "running the situation, and the leverage is in the position you can " +
        "actually act on.",
    )
  }

  return "**Reading the spread as a whole.** " + bits.join(" ")
}

/** Draw and compose in one call -- the common case. */
export function readSpread(spreadSlug: string, question = "", allowReversed = true): Reading {
  const spread = SPREADS[spreadSlug]
  if (!spread) throw new Error(`unknown spread: ${spreadSlug}`)
  return composeReading(
    hydrate(drawCards(spread.count, allowReversed), spread),
    spread,
    question,
  )
}
