/** Domain types shared by every surface: the website, and later a native app.
 *
 * Nothing here imports React or Node. That is the point of the package -- the
 * reading engine has to run identically in a Next.js server component, in a
 * browser, and in React Native, so it may not reach for any of them.
 */

export type Arcana = "major" | "minor"
export type SuitSlug = "wands" | "cups" | "swords" | "pentacles"
export type Ink = "yellow" | "red" | "blue" | "green" | "slate"

export interface Card {
  slug: string
  name: string
  arcana: Arcana
  /** null for the major arcana. */
  suit: SuitSlug | null
  number: number
  roman: string
  emblem: string
  ink: Ink
  element: string
  astrology: string
  up_keys: string[]
  rev_keys: string[]
  /** Upright meaning, one paragraph. */
  up: string
  /** Reversed meaning, one paragraph. */
  rev: string
  /** Per-context readings, keyed by context slug. */
  ctx: Record<string, { up: string; rev: string }>
  yesno: string
}

export interface Suit {
  name: string
  element: string
  ink: Ink
  domain: string
  season: string
}

export interface Rank {
  number: number
  name: string
  roman: string
}

export interface Context {
  slug: string
  label: string
}

export interface SpreadPosition {
  name: string
  note: string
}

export interface Spread {
  slug: string
  name: string
  count: number
  tier: string
  blurb: string
  positions: SpreadPosition[]
}

export interface Correspondence {
  colour: string
  hex: string
  stone: string
  metal: string
  source: string
}

/** One card as it landed in a spread. */
export interface DrawnCard {
  card: Card
  reversed: boolean
  position: SpreadPosition
}

export interface Reading {
  spread: Spread
  question: string
  cards: DrawnCard[]
  /** One paragraph per position, then a closing synthesis. */
  passages: string[]
  synthesis: string
}
