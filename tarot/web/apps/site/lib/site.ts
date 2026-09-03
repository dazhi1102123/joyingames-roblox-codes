/** Site-wide constants. One place, so metadata and the sitemap agree. */

export const SITE = {
  name: "Arcana Press",
  tagline: "A tarot reading that answers the question you actually asked.",
  description:
    "Free tarot readings interpreted by position, not by generic card meanings. " +
    "All 78 cards, upright and reversed, across love, career, money and health.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  operator: "OneFusion",
  locale: "en",
} as const

export function canonical(path: string): string {
  return new URL(path, SITE.url).toString()
}
