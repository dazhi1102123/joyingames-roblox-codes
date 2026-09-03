import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CARDS, CONTEXTS, CORRESPONDENCES, cardBySlug } from "@arcana/core"
import { CardFace } from "../../card-face"
import { canonical } from "@/lib/site"

type Params = { params: Promise<{ slug: string }> }

/** Every card page is built at build time. This is the whole SEO argument for
 *  Next.js here: 78 static HTML files a crawler gets with no JS execution. */
export function generateStaticParams() {
  return CARDS.map((card) => ({ slug: card.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const card = cardBySlug(slug)
  if (!card) return {}
  const arcana = card.arcana === "major" ? "Major arcana" : `${card.suit}`
  return {
    title: `${card.name} Meaning — Upright & Reversed`,
    description:
      `${card.name}: ${card.up_keys.slice(0, 3).join(", ")} upright, ` +
      `${card.rev_keys.slice(0, 3).join(", ")} reversed. ${arcana}, element ` +
      `${card.element}. Meanings for love, career, money and health.`,
    alternates: { canonical: canonical(`/cards/${card.slug}`) },
    openGraph: {
      title: `${card.name} — tarot card meaning`,
      description: card.up.slice(0, 200),
      url: canonical(`/cards/${card.slug}`),
    },
  }
}

export default async function CardPage({ params }: Params) {
  const { slug } = await params
  const card = cardBySlug(slug)
  if (!card) notFound()

  const corr = CORRESPONDENCES[card.slug]
  const index = CARDS.findIndex((c) => c.slug === card.slug)
  const neighbours = [CARDS[index - 1], CARDS[index + 1]].filter(Boolean)

  // Structured data. Crawlers read this even though visitors never see it,
  // and it is what wins the rich result for a "X tarot meaning" query.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${card.name} — tarot card meaning`,
    description: card.up,
    articleSection: card.arcana === "major" ? "Major Arcana" : card.suit,
    about: { "@type": "Thing", name: card.name },
  }

  return (
    <article className="card-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <a href="/cards">The deck</a> /{" "}
        <span>{card.name}</span>
      </nav>

      <div className="card-layout">
        <aside>
          <CardFace slug={card.slug} className="large" />
          <dl className="facts">
            <div>
              <dt>Arcana</dt>
              <dd>{card.arcana === "major" ? "Major" : "Minor"}</dd>
            </div>
            <div>
              <dt>Number</dt>
              <dd>{card.roman}</dd>
            </div>
            <div>
              <dt>Element</dt>
              <dd>{card.element}</dd>
            </div>
            <div>
              <dt>Astrology</dt>
              <dd>{card.astrology}</dd>
            </div>
            <div>
              <dt>Yes / No</dt>
              <dd className="cap">{card.yesno}</dd>
            </div>
            {corr && (
              <>
                <div>
                  <dt>Colour</dt>
                  <dd>
                    <i className="swatch" style={{ background: corr.hex }} />
                    {corr.colour}
                  </dd>
                </div>
                <div>
                  <dt>Stone</dt>
                  <dd>{corr.stone}</dd>
                </div>
              </>
            )}
          </dl>
        </aside>

        <div className="card-body">
          <h1>{card.name}</h1>

          <ul className="keys">
            {card.up_keys.map((k) => (
              <li key={k}>{k}</li>
            ))}
            {card.rev_keys.map((k) => (
              <li key={k} className="rev">
                {k} (rev)
              </li>
            ))}
          </ul>

          <h2 className="label">Upright</h2>
          <p>{card.up}</p>

          <h2 className="label">Reversed</h2>
          <p>{card.rev}</p>

          {CONTEXTS.filter((c) => c.slug !== "general" && card.ctx[c.slug]).map((c) => (
            <section key={c.slug} className="ctx">
              <h2>
                {card.name} in {c.label.toLowerCase()}
              </h2>
              <p>
                <strong>Upright.</strong> {card.ctx[c.slug].up}
              </p>
              <p>
                <strong>Reversed.</strong> {card.ctx[c.slug].rev}
              </p>
            </section>
          ))}

          <aside className="cta">
            <p>
              See {card.name} in a real spread. A single card meaning is a
              definition; a reading is what it means next to the others.
            </p>
            <a className="btn primary" href="/reading/three-card">
              Draw three cards
            </a>
          </aside>

          {neighbours.length > 0 && (
            <section>
              <h2>Read next</h2>
              <ul className="neighbours">
                {neighbours.map((n) => (
                  <li key={n.slug}>
                    <a href={`/cards/${n.slug}`}>
                      <CardFace slug={n.slug} />
                      <span>{n.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </article>
  )
}
