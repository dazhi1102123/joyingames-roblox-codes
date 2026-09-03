import type { MetadataRoute } from "next"
import { CARDS, CONTEXTS, SPREADS, allDateSlugs } from "@arcana/core"
import { comboPairs, comboScope } from "@/lib/pages"
import { canonical } from "@/lib/site"

/** Next splits this into /sitemap/[id].xml and emits an index automatically
 *  once generateSitemaps is exported, which is what keeps a matrix of this
 *  size inside the 50,000-URL limit per file. */
const CHUNK = 20_000

function allUrls(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [
    { url: canonical("/"), priority: 1, changeFrequency: "weekly" },
    { url: canonical("/cards"), priority: 0.9, changeFrequency: "monthly" },
    { url: canonical("/report"), priority: 0.9, changeFrequency: "monthly" },
    { url: canonical("/readers"), priority: 0.9, changeFrequency: "weekly" },
    { url: canonical("/daily"), priority: 0.8, changeFrequency: "daily" },
    { url: canonical("/spreads"), priority: 0.7, changeFrequency: "monthly" },
    { url: canonical("/learn"), priority: 0.6, changeFrequency: "monthly" },
    { url: canonical("/birth-card"), priority: 0.9, changeFrequency: "monthly" },
  ]

  // 366 date pages. "birth card april 3" is a question with one answer, and a
  // page per date answers it instead of making someone operate a form.
  for (const slug of allDateSlugs()) {
    urls.push({ url: canonical(`/birth-card/${slug}`), priority: 0.7 })
  }

  for (const spread of Object.values(SPREADS)) {
    urls.push({ url: canonical(`/reading/${spread.slug}`), priority: 0.8 })
  }

  // The context hubs, then the 390 per-card-per-context pages. These are what
  // the site is actually found by, so they outrank the marketing surface.
  for (const context of CONTEXTS) {
    if (context.slug === "general") continue
    urls.push({ url: canonical(`/cards/context/${context.slug}`), priority: 0.85 })
  }

  for (const card of CARDS) {
    urls.push({ url: canonical(`/cards/${card.slug}`), priority: 0.9 })
    for (const context of CONTEXTS) {
      if (context.slug === "general" || !card.ctx[context.slug]) continue
      urls.push({ url: canonical(`/cards/${card.slug}/${context.slug}`), priority: 0.8 })
    }
  }

  // Combination pages, only as far as COMBO_SITEMAP_SCOPE allows. Advertising
  // six thousand thin pages on a new domain is how crawl budget gets cut.
  for (const [a, b] of comboPairs()) {
    urls.push({ url: canonical(`/combinations/${a}/${b}`), priority: 0.5 })
  }

  // Legal pages are noindex, so they are deliberately not listed.
  return urls
}

/** How many sitemap files the corpus needs. The index route reads this too,
 *  so the two can never disagree about how many exist. */
export const SITEMAP_PAGES = Math.max(1, Math.ceil(allUrls().length / CHUNK))

export function generateSitemaps() {
  return Array.from({ length: SITEMAP_PAGES }, (_, id) => ({ id }))
}

export default function sitemap({ id }: { id: number }): MetadataRoute.Sitemap {
  return allUrls().slice(id * CHUNK, (id + 1) * CHUNK)
}

