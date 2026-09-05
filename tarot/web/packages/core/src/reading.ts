/** The reading engine: draw cards, then say something true about the spread.
 *
 * Ported from tarot/app.py. It stays free of React and Node built-ins so the
 * same code runs in a server component, in a browser, and in React Native.
 */

import { CARDS, CARDS as ALL, CORRESPONDENCES, SPREADS, SUITS } from "./data.generated"
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

// --------------------------------------------------------------------------
// Correspondences, framed as observation rather than prescription
// --------------------------------------------------------------------------


/** The line the whole correspondence feature has to stay inside.
 *
 * A colour and a stone are traditional associations. The moment the copy says
 * "wear this to attract" it is selling a remedy, which is both a §5 UWG
 * problem and a different business than this one.
 */
export const SAFE_FRAMING =
  "Correspondences are traditional associations, not remedies. Say 'the stone " +
  "associated with this card', never 'wear this to attract' or 'this will " +
  "protect you from'."

/** One sentence on the card's shadow, phrased as observation not prophecy.
 *
 * A card's reversed keywords are exactly the failure mode of its upright
 * meaning, which makes them the honest source for a caution line. Nothing
 * here predicts an event.
 */
export function watchLine(card: Card, reversed = false): string {
  if (reversed) {
    return (
      `Worth watching: ${card.name} is already reversed, so the shadow is the ` +
      `surface — ${card.rev_keys.slice(0, 2).join(", ")}. Read it as a description ` +
      "of where you are, not a forecast of where you are going."
    )
  }
  return (
    "Worth watching: every card has a way of curdling, and this one curdles into " +
    `${card.rev_keys.slice(0, 2).join(", ")}. Noticing that early is the whole use ` +
    "of knowing it."
  )
}

export interface Brief {
  card: Card
  reversed: boolean
  colour: string
  hex: string
  stone: string
  metal: string
  source: string
  watch: string
  keywords: string[]
  body: string
}

/** Everything the daily line and the report footer need for one card. */
export function briefFor(card: Card, reversed = false): Brief {
  const c = CORRESPONDENCES[card.slug]
  return {
    card,
    reversed,
    colour: c?.colour ?? "",
    hex: c?.hex ?? "",
    stone: c?.stone ?? "",
    metal: c?.metal ?? "",
    source: c?.source ?? "",
    watch: watchLine(card, reversed),
    keywords: (reversed ? card.rev_keys : card.up_keys).slice(0, 3),
    body: reversed ? card.rev : card.up,
  }
}

// --------------------------------------------------------------------------
// Birth cards
// --------------------------------------------------------------------------

const MAJORS = ALL.filter((c) => c.arcana === "major")

const digitSum = (n: number) =>
  String(n).split("").reduce((sum, d) => sum + Number(d), 0)

/** Personality and soul cards for a birth date.
 *
 * Add month + day + year and reduce by digit sum until 22 or below; 22 folds
 * to The Fool. A two-digit result has its own digit sum sitting beneath it as
 * the soul card, which is why some people get two cards and others one.
 */
export function birthCards(year: number, month: number, day: number) {
  let total = month + day + year
  while (total > 22) total = digitSum(total)
  if (total === 22) total = 0

  const soulN = total > 9 ? digitSum(total) : total
  return { personality: MAJORS[total], soul: MAJORS[soulN] }
}

/** The card for one calendar year, on the same reduction. */
export function yearCard(cardYear: number, month: number, day: number): Card {
  let total = month + day + cardYear
  while (total > 22) total = digitSum(total)
  if (total === 22) total = 0
  return MAJORS[total]
}

/** The same card for everyone, changing at midnight. Deterministic on
 *  purpose: a "card of the day" that differs per visitor is not a day's card. */
export function cardOfTheDay(today = new Date()): Card {
  const days = Math.floor(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) / 86_400_000,
  )
  return ALL[days % ALL.length]
}

// --------------------------------------------------------------------------
// Share codec
//
// A reading is (spread, [(card, reversed)]). Packed one byte per card plus a
// leading spread byte, then base64url -- a ten-card Celtic Cross fits in 15
// characters, short enough to paste anywhere without a shortener.
// --------------------------------------------------------------------------

const SPREAD_ORDER = Object.keys(SPREADS)
const CARD_ORDER = ALL.map((c) => c.slug)
const CARD_INDEX = new Map(CARD_ORDER.map((slug, i) => [slug, i]))

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(code: string): Uint8Array | null {
  try {
    const padded = code.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (code.length % 4)) % 4)
    const binary = atob(padded)
    return Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
  } catch {
    return null
  }
}

export function encodeReading(spreadSlug: string, drawn: DrawSpec[]): string {
  const index = SPREAD_ORDER.indexOf(spreadSlug)
  if (index < 0) throw new Error("unknown spread")
  const bytes = new Uint8Array(drawn.length + 1)
  bytes[0] = index
  drawn.forEach((d, i) => {
    bytes[i + 1] = CARD_INDEX.get(d.slug)! * 2 + (d.reversed ? 1 : 0)
  })
  return toBase64Url(bytes)
}

/** Returns null on anything malformed. Never throws -- this parses a value
 *  straight out of a URL, so hostile input is the expected case. */
export function decodeReading(
  code: string,
): { spread: Spread; drawn: DrawSpec[] } | null {
  if (!code || code.length > 32) return null
  const raw = fromBase64Url(code)
  if (!raw || raw.length < 2 || raw[0] >= SPREAD_ORDER.length) return null

  const spread = SPREADS[SPREAD_ORDER[raw[0]]]
  if (raw.length - 1 !== spread.count) return null

  const drawn: DrawSpec[] = []
  const seen = new Set<number>()
  for (let i = 1; i < raw.length; i++) {
    const index = raw[i] >> 1
    const reversed = (raw[i] & 1) === 1
    // A deck cannot deal the same card twice; a code that says otherwise was
    // edited by hand.
    if (index >= CARD_ORDER.length || seen.has(index)) return null
    seen.add(index)
    drawn.push({ slug: CARD_ORDER[index], reversed })
  }
  return { spread, drawn }
}

// --------------------------------------------------------------------------
// Calendar
// --------------------------------------------------------------------------

export const MONTHS = [
  ["january", "January", 31], ["february", "February", 29],
  ["march", "March", 31], ["april", "April", 30],
  ["may", "May", 31], ["june", "June", 30],
  ["july", "July", 31], ["august", "August", 31],
  ["september", "September", 30], ["october", "October", 31],
  ["november", "November", 30], ["december", "December", 31],
] as const

/** 29 February is included on purpose: someone born on it still has a birth
 *  card, and a page that 404s on their birthday is the wrong answer. */
export function allDateSlugs(): string[] {
  return MONTHS.flatMap(([slug, , days]) =>
    Array.from({ length: days as number }, (_, i) => `${slug}-${i + 1}`),
  )
}

export function parseDateSlug(slug: string): { month: number; day: number } | null {
  const at = slug.lastIndexOf("-")
  if (at < 0) return null
  const name = slug.slice(0, at)
  const day = Number(slug.slice(at + 1))
  const month = MONTHS.findIndex(([s]) => s === name)
  if (month < 0 || !Number.isInteger(day)) return null
  if (day < 1 || day > (MONTHS[month][2] as number)) return null
  return { month: month + 1, day }
}

export const monthName = (month: number) => MONTHS[month - 1][1]

// --------------------------------------------------------------------------
// Follow-up questions
//
// The second question is usually the real one. The first is what someone felt
// able to type.
//
// A follow-up re-reads the cards already on the table through a different
// lens rather than drawing again -- drawing again would be a different
// reading, and answering "what am I avoiding" with fresh cards answers nothing.
// Each lens is derived from the actual spread, so it says something the first
// pass did not.
// --------------------------------------------------------------------------

export interface FollowUp {
  key: string
  question: string
  answer: string
}

/** The card carrying the most weight: the first major arcana if the spread has
 *  one, otherwise the closing position, which is where a linear spread lands. */
function anchorOf(cards: DrawnCard[]): DrawnCard {
  return cards.find((c) => c.card.arcana === "major") ?? cards[cards.length - 1]
}

function askDo(cards: DrawnCard[], spread: Spread): string {
  // The middle of a spread is where the lever usually sits: past and outcome
  // are description, the middle is the part still open.
  const at = Math.floor((cards.length - 1) / 2)
  const entry = cards[at]
  const keys = entry.reversed ? entry.card.rev_keys : entry.card.up_keys
  return (
    `**${entry.position.name} — ${entry.card.name}${entry.reversed ? ", reversed" : ""}.** ` +
    `This is the position with something still open in it. ${entry.position.note} ` +
    `Read as an instruction rather than a description, it points at ${keys[0]}` +
    (keys[1] ? ` and ${keys[1]}` : "") +
    `. That is the smallest real move available, not the largest.`
  )
}

function askAvoiding(cards: DrawnCard[]): string {
  const reversed = cards.filter((c) => c.reversed)
  if (reversed.length) {
    const names = reversed.map((c) => `${c.card.name} in ${c.position.name.toLowerCase()}`)
    const first = reversed[0]
    return (
      `**What is turned away.** ${names.join(", ")}. A reversal is the upright ` +
      `meaning blocked, internalised or mistimed rather than absent — so the ` +
      `energy is present and going somewhere else. ${first.card.name} reversed ` +
      `reads as ${first.card.rev_keys.slice(0, 2).join(" or ")}, and that is the ` +
      `part of this you already know and have not said out loud.`
    )
  }
  const anchor = anchorOf(cards)
  return (
    `**Nothing is reversed.** There is no card here describing something ` +
    `blocked, which is unusual and worth noticing: what this spread describes ` +
    `is moving openly. If something still feels avoided, it is not in the ` +
    `cards — it is in the question you chose to ask. ${anchor.card.name} in ` +
    `${anchor.position.name.toLowerCase()} is the closest thing to a hard edge here.`
  )
}

function askNothing(cards: DrawnCard[], spread: Spread): string {
  const last = cards[cards.length - 1]
  const keys = last.reversed ? last.card.rev_keys : last.card.up_keys
  return (
    `**${last.position.name} — ${last.card.name}${last.reversed ? ", reversed" : ""}.** ` +
    `The closing position is not a prediction; it is where the present course ` +
    `arrives if nothing changes. On these terms that is ${keys.slice(0, 2).join(", ")}. ` +
    `Whether that is acceptable is the actual decision — the spread cannot make ` +
    `it and does not know your circumstances.`
  )
}

function askWhichCard(cards: DrawnCard[]): string {
  const anchor = anchorOf(cards)
  const majors = cards.filter((c) => c.card.arcana === "major")
  const why =
    anchor.card.arcana === "major"
      ? majors.length > 1
        ? `It is the first of ${majors.length} major arcana here, and majors describe structure rather than mood.`
        : "It is the only major arcana in the spread, which makes it the theme the rest is arranged around."
      : "No major arcana came up, so the weight falls on the closing position rather than on a theme."
  return (
    `**${anchor.card.name}, in ${anchor.position.name.toLowerCase()}.** ${why} ` +
    `${anchor.reversed ? anchor.card.rev : anchor.card.up} If you take one thing ` +
    `from this reading, take this card in this position.`
  )
}

const LENSES: Array<{ key: string; question: string; answer: (c: DrawnCard[], s: Spread) => string }> = [
  { key: "do", question: "What is this asking me to do?", answer: askDo },
  { key: "avoiding", question: "What am I avoiding?", answer: (c) => askAvoiding(c) },
  { key: "nothing", question: "What if I change nothing?", answer: askNothing },
  { key: "which", question: "Which card matters most here?", answer: (c) => askWhichCard(c) },
]

export const FOLLOW_UP_QUESTIONS = LENSES.map((l) => ({ key: l.key, question: l.question }))

/** Answer one follow-up against a reading already on the table. */
export function followUp(reading: Reading, key: string): FollowUp | null {
  const lens = LENSES.find((l) => l.key === key)
  if (!lens) return null
  return {
    key: lens.key,
    question: lens.question,
    answer: lens.answer(reading.cards, reading.spread),
  }
}
