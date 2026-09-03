import { CARDS, CONTEXTS, SUITS, type Card } from "@arcana/core"

/** Text for the pages generated per card, per context and per pair.
 *
 * Ported from app.py. These are the pages the site is actually found by, so
 * the copy has to say something specific about the combination in front of
 * it -- a template with the names swapped in is what every other tarot site
 * already publishes, and it is why they read as interchangeable.
 */

export const CONTEXT_LABEL = new Map(CONTEXTS.map((c) => [c.slug, c.label]))

export const MAJOR_SLUGS = CARDS.filter((c) => c.arcana === "major").map((c) => c.slug)

/** How much of the 6,084-pair matrix to publish.
 *
 * Staged on purpose: putting six thousand thin pages up at once is how a new
 * domain gets its crawl budget cut. Majors-only is 462 pairs, which is enough
 * to measure an indexation rate before opening the rest.
 */
export function comboScope(): "none" | "majors" | "all" {
  const scope = process.env.COMBO_SITEMAP_SCOPE ?? "majors"
  return scope === "none" || scope === "all" ? scope : "majors"
}

export function comboPairs(): Array<[string, string]> {
  const scope = comboScope()
  if (scope === "none") return []
  const pool = scope === "all" ? CARDS.map((c) => c.slug) : MAJOR_SLUGS
  const pairs: Array<[string, string]> = []
  for (const a of pool) for (const b of pool) if (a !== b) pairs.push([a, b])
  return pairs
}

/** What the two cards share, and where they pull apart. */
export function comboReading(a: Card, b: Card): { shared: string; tension: string } {
  let shared: string

  if (a.element === b.element) {
    shared =
      `Both cards sit in ${a.element}, which doubles the register rather than ` +
      "balancing it — expect intensity rather than nuance."
  } else if (a.arcana === "major" && b.arcana === "major") {
    shared =
      "Two major arcana together describe a structural moment, not a passing mood."
  } else if (a.arcana === "minor" && b.arcana === "minor" && a.suit === b.suit) {
    const s = SUITS[a.suit!]
    shared = `Two ${s.name} narrow the reading firmly onto ${s.domain}.`
  } else if (a.arcana !== b.arcana) {
    const [major, minor] = a.arcana === "major" ? [a, b] : [b, a]
    shared =
      `${major.name} sets the theme and ${minor.name} says where it lands in practice.`
  } else {
    shared =
      "The two cards come from different registers, so read them as cause and " +
      "consequence rather than as a single statement."
  }

  const tension =
    `${a.name} pulls toward ${a.up_keys[0]}; ${b.name} pulls toward ${b.up_keys[0]}. ` +
    "Where those two meet is the actual subject of the reading."

  return { shared, tension }
}

/** Cards adjacent in the deck, plus one sharing the element -- a related
 *  list built from the corpus rather than from what happens to be nearby in
 *  an array, so the internal links mean something to a crawler. */
export function relatedCards(card: Card, limit = 4): Card[] {
  const index = CARDS.findIndex((c) => c.slug === card.slug)
  const neighbours = [CARDS[index - 1], CARDS[index + 1]].filter(Boolean) as Card[]
  const sameElement = CARDS.filter(
    (c) => c.element === card.element && c.slug !== card.slug && !neighbours.includes(c),
  )
  return [...neighbours, ...sameElement].slice(0, limit)
}
