import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CONTEXTS, cardBySlug } from "@arcana/core"
import { CardFace } from "../../../card-face"
import { comboPairs, comboReading } from "@/lib/pages"
import { canonical } from "@/lib/site"

type Params = { params: Promise<{ a: string; b: string }> }

/** Two-card combination pages.
 *
 * The full matrix is 6,084 ordered pairs. Only the scope in COMBO_SITEMAP_SCOPE
 * is prerendered -- majors-only by default, 462 pairs -- because putting six
 * thousand thin pages up at once is how a new domain gets its crawl budget
 * cut. Anything outside the scope still renders on demand; it just is not
 * advertised in the sitemap until the indexation rate says it should be.
 */
export function generateStaticParams() {
  return comboPairs().map(([a, b]) => ({ a, b }))
}

export const dynamicParams = true

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { a, b } = await params
  const cardA = cardBySlug(a)
  const cardB = cardBySlug(b)
  if (!cardA || !cardB || a === b) return {}
  return {
    title: `${cardA.name} and ${cardB.name} Together`,
    description:
      `What ${cardA.name} and ${cardB.name} mean when they appear in the same ` +
      `reading, upright and reversed.`,
    alternates: { canonical: canonical(`/combinations/${a}/${b}`) },
  }
}

export default async function Combination({ params }: Params) {
  const { a, b } = await params
  const cardA = cardBySlug(a)
  const cardB = cardBySlug(b)
  if (!cardA || !cardB || a === b) notFound()

  const { shared, tension } = comboReading(cardA, cardB)
  const contexts = CONTEXTS.filter(
    (c) => c.slug !== "general" && cardA.ctx[c.slug] && cardB.ctx[c.slug],
  )

  return (
    <article className="prose-wide">
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/cards">The deck</a> / <a href={`/cards/${a}`}>{cardA.name}</a> +{" "}
        <a href={`/cards/${b}`}>{cardB.name}</a>
      </nav>

      <p className="eyebrow">Combination</p>
      <h1>
        {cardA.name} and {cardB.name} together
      </h1>

      <ul className="combo-pair">
        {[cardA, cardB].map((c) => (
          <li key={c.slug}>
            <a href={`/cards/${c.slug}`}>
              <CardFace slug={c.slug} />
              <span className="cardname">{c.name}</span>
            </a>
          </li>
        ))}
      </ul>

      <h2 className="label">What they share</h2>
      <p>{shared}</p>

      <h2 className="label">Where they pull apart</h2>
      <p>{tension}</p>

      <h2>Each card on its own</h2>
      <p>
        <strong>{cardA.name}.</strong> {cardA.up}
      </p>
      <p>
        <strong>{cardB.name}.</strong> {cardB.up}
      </p>

      <h2>Reversed</h2>
      <p>
        Either card reversed changes the pair rather than just itself.{" "}
        {cardA.name} reversed reads as {cardA.rev_keys.slice(0, 2).join(" or ")}, which
        turns the shared ground above into a question rather than a statement. The same
        is true of {cardB.name} reversed: {cardB.rev_keys.slice(0, 2).join(" or ")}.
      </p>

      {contexts.length > 0 && (
        <section>
          <h2>The pair by question</h2>
          <dl className="positions">
            {contexts.map((c) => (
              <div key={c.slug}>
                <dt>{c.label}</dt>
                <dd>
                  <a href={`/cards/${a}/${c.slug}`}>{cardA.name}</a>:{" "}
                  {cardA.ctx[c.slug].up}{" "}
                  <a href={`/cards/${b}/${c.slug}`}>{cardB.name}</a>:{" "}
                  {cardB.ctx[c.slug].up}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <aside className="cta">
        <p>
          A pair is not a reading. Position decides what each card is answering — draw
          a spread and see where these two land.
        </p>
        <a className="btn primary" href="/reading/three-card">
          Draw three cards
        </a>
      </aside>
    </article>
  )
}
