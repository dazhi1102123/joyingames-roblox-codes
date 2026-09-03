import type { MetadataRoute } from "next"
import { CARDS, CONTEXTS, SPREADS } from "@arcana/core"
import { canonical } from "@/lib/site"

/** Next builds this into /sitemap.xml at build time.
 *
 * Priorities are relative, not absolute: card pages are the pages that earn
 * search traffic, so they outrank the marketing surface here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: canonical("/"), priority: 1, changeFrequency: "weekly" },
    { url: canonical("/cards"), priority: 0.9, changeFrequency: "monthly" },
    { url: canonical("/spreads"), priority: 0.7, changeFrequency: "monthly" },
  ]

  for (const spread of Object.values(SPREADS)) {
    entries.push({
      url: canonical(`/reading/${spread.slug}`),
      priority: 0.8,
      changeFrequency: "monthly",
    })
  }

  for (const card of CARDS) {
    entries.push({
      url: canonical(`/cards/${card.slug}`),
      priority: 0.9,
      changeFrequency: "monthly",
    })
  }

  for (const page of ["disclaimer", "privacy", "terms", "impressum"]) {
    entries.push({ url: canonical(`/legal/${page}`), priority: 0.3 })
  }

  return entries
}
