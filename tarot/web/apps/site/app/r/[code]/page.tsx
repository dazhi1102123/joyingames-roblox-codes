import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { composeReading, decodeReading, hydrate, renderMarkdown } from "@arcana/core"
import { CardFace } from "../../card-face"

/** A shared reading.
 *
 * The whole reading is in the URL -- there is no record of it on the server,
 * so a link cannot be revoked and nothing was stored to leak. Noindex,
 * because a per-visitor draw is thin duplicate content and would only burn
 * crawl budget.
 */
export const metadata: Metadata = {
  title: "A shared reading",
  robots: { index: false, follow: false },
}

type Params = { params: Promise<{ code: string }> }

export default async function Shared({ params }: Params) {
  const { code } = await params
  const decoded = decodeReading(code)
  if (!decoded) notFound()

  const { spread, drawn } = decoded
  const cards = hydrate(drawn, spread)
  const reading = composeReading(cards, spread)

  return (
    <article className="reading-page">
      <p className="eyebrow">A shared {spread.name.toLowerCase()}</p>
      <h1>{spread.name}</h1>
      <p className="lede">{spread.blurb}</p>

      <ol className="spread-grid" data-count={cards.length}>
        {cards.map((entry, i) => (
          <li key={`${entry.card.slug}-${i}`}>
            <span className="pos">{entry.position.name}</span>
            <CardFace slug={entry.card.slug} reversed={entry.reversed} />
            <a className="cardname" href={`/cards/${entry.card.slug}`}>
              {entry.card.name}
            </a>
            {entry.reversed && <span className="tag">Reversed</span>}
          </li>
        ))}
      </ol>

      <section className="interpretation">
        <h2>The reading</h2>
        {reading.passages.map((p, i) => (
          <p key={i} dangerouslySetInnerHTML={{ __html: renderMarkdown(p) }} />
        ))}
      </section>

      <aside className="cta">
        <p>
          This reading travels entirely in its link — nothing about it was stored
          here. Draw your own and you get a different spread.
        </p>
        <a className="btn primary" href={`/reading/${spread.slug}`}>
          Draw this spread
        </a>
      </aside>
    </article>
  )
}
