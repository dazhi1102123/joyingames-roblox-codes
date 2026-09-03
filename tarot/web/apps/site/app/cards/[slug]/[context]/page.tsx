import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CARDS, CONTEXTS, CORRESPONDENCES, cardBySlug } from "@arcana/core"
import { CardFace } from "../../../card-face"
import { CONTEXT_LABEL, relatedCards } from "@/lib/pages"
import { canonical } from "@/lib/site"

type Params = { params: Promise<{ slug: string; context: string }> }

/** 78 cards x 5 contexts = 390 static pages.
 *
 * "What does The Moon mean" and "what does The Moon mean about my
 * relationship" are different searches with different intents, and answering
 * them on one page answers neither well. This is the bulk of what the site is
 * found by.
 */
export function generateStaticParams() {
  return CARDS.flatMap((card) =>
    CONTEXTS.filter((c) => c.slug !== "general" && card.ctx[c.slug]).map((c) => ({
      slug: card.slug,
      context: c.slug,
    })),
  )
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, context } = await params
  const card = cardBySlug(slug)
  const label = CONTEXT_LABEL.get(context)
  if (!card || !label || !card.ctx[context]) return {}
  return {
    title: `${card.name} Meaning — ${label}`,
    description:
      `${card.name} tarot card meaning for ${label.toLowerCase()}: ` +
      `${card.up_keys.slice(0, 3).join(", ")} upright, ` +
      `${card.rev_keys.slice(0, 2).join(", ")} reversed.`,
    alternates: { canonical: canonical(`/cards/${slug}/${context}`) },
  }
}

export default async function CardContextPage({ params }: Params) {
  const { slug, context } = await params
  const card = cardBySlug(slug)
  const label = CONTEXT_LABEL.get(context)
  if (!card || !label || !card.ctx[context]) notFound()

  const reading = card.ctx[context]
  const corr = CORRESPONDENCES[card.slug]
  const related = relatedCards(card)
  const others = CONTEXTS.filter(
    (c) => c.slug !== "general" && c.slug !== context && card.ctx[c.slug],
  )

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${card.name} — ${label.toLowerCase()}`,
    description: reading.up,
    about: { "@type": "Thing", name: card.name },
    isPartOf: { "@type": "Collection", name: `${label} tarot meanings` },
  }

  return (
    <article className="card-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <a href="/cards">The deck</a> /{" "}
        <a href={`/cards/${card.slug}`}>{card.name}</a> / <span>{label}</span>
      </nav>

      <div className="card-layout">
        <aside>
          <CardFace slug={card.slug} className="large" priority />
          <dl className="facts">
            <div>
              <dt>Arcana</dt>
              <dd>{card.arcana === "major" ? "Major" : "Minor"}</dd>
            </div>
            <div>
              <dt>Element</dt>
              <dd>{card.element}</dd>
            </div>
            <div>
              <dt>Yes / No</dt>
              <dd className="cap">{card.yesno}</dd>
            </div>
            {corr && (
              <div>
                <dt>Colour</dt>
                <dd>
                  <i className="swatch" style={{ background: corr.hex }} />
                  {corr.colour}
                </dd>
              </div>
            )}
          </dl>
        </aside>

        <div className="card-body">
          <p className="eyebrow">{label}</p>
          <h1>
            {card.name} in {label.toLowerCase()}
          </h1>

          <h2 className="label">Upright</h2>
          <p>{reading.up}</p>

          <h2 className="label">Reversed</h2>
          <p>{reading.rev}</p>

          <h2>Why it reads that way here</h2>
          <p>
            The general meaning of {card.name} is {card.up_keys.slice(0, 3).join(", ")}.
            Read against {label.toLowerCase()}, that becomes specific:{" "}
            {reading.up.charAt(0).toLowerCase() + reading.up.slice(1)} A card&rsquo;s
            meaning is not a fixed sentence — it is the same shape applied to a
            different question, which is why a single paragraph about the card in
            general answers neither.
          </p>

          <aside className="cta">
            <p>
              This is one card in one context. A reading is what it means next to the
              others.
            </p>
            <a className="btn primary" href="/reading/three-card">
              Draw three cards
            </a>
          </aside>

          {others.length > 0 && (
            <section>
              <h2>{card.name} in other contexts</h2>
              <ul className="keys">
                {others.map((c) => (
                  <li key={c.slug}>
                    <a href={`/cards/${card.slug}/${c.slug}`}>{c.label}</a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2>Cards that read close to this one</h2>
            <ul className="neighbours">
              {related.map((c) => (
                <li key={c.slug}>
                  <a href={`/cards/${c.slug}/${context}`}>
                    <CardFace slug={c.slug} />
                    <span>{c.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </article>
  )
}
