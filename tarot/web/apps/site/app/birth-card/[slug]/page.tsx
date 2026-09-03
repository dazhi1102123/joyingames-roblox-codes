import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CORRESPONDENCES, allDateSlugs, birthCards, monthName, parseDateSlug, yearCard } from "@arcana/core"
import { CardFace } from "../../card-face"
import { canonical } from "@/lib/site"

type Params = { params: Promise<{ slug: string }> }

/** 366 date pages. Someone searching "birth card april 3" is asking a
 *  question with one answer, and a page per date answers it directly rather
 *  than making them operate a form. */
export function generateStaticParams() {
  return allDateSlugs().map((slug) => ({ slug }))
}

/** The birth year changes which card you get, so the page reads across a
 *  representative span rather than pretending one date has one answer. */
const YEARS = [1960, 1970, 1980, 1990, 2000, 2010, 2020]

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const date = parseDateSlug(slug)
  if (!date) return {}
  const label = `${monthName(date.month)} ${date.day}`
  return {
    title: `Tarot Birth Card for ${label}`,
    description:
      `The personality and soul cards for anyone born on ${label}, by birth year, ` +
      "with the card for the current year.",
    alternates: { canonical: canonical(`/birth-card/${slug}`) },
  }
}

export default async function DatePage({ params }: Params) {
  const { slug } = await params
  const date = parseDateSlug(slug)
  if (!date) notFound()

  const label = `${monthName(date.month)} ${date.day}`
  const rows = YEARS.map((year) => ({ year, ...birthCards(year, date.month, date.day) }))
  const current = yearCard(new Date().getFullYear(), date.month, date.day)
  const corr = CORRESPONDENCES[current.slug]

  return (
    <article className="prose-wide">
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/birth-card">Birth cards</a> / <span>{label}</span>
      </nav>

      <p className="eyebrow">Birth card</p>
      <h1>Born on {label}</h1>
      <p className="lede">
        The birth card comes from month + day + year, reduced by digit sum until it is
        22 or less. The month and day are fixed here; the year moves, so this date has
        a different answer depending on when you were born.
      </p>

      <table className="ledger">
        <thead>
          <tr>
            <th>Birth year</th>
            <th>Personality</th>
            <th>Soul</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.year}>
              <td>{row.year}</td>
              <td>
                <a href={`/cards/${row.personality.slug}`}>{row.personality.name}</a>
              </td>
              <td>
                {row.personality.slug === row.soul.slug ? (
                  <span className="note">same</span>
                ) : (
                  <a href={`/cards/${row.soul.slug}`}>{row.soul.name}</a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="note">
        Not your year? <a href="/birth-card">Work out any date →</a>
      </p>

      <section>
        <h2>
          {label} in {new Date().getFullYear()}
        </h2>
        <div className="card-layout">
          <aside>
            <CardFace slug={current.slug} className="large" />
          </aside>
          <div className="card-body">
            <h3>{current.name}</h3>
            <p>{current.up}</p>
            <dl className="facts">
              <div>
                <dt>Element</dt>
                <dd>{current.element}</dd>
              </div>
              <div>
                <dt>Colour</dt>
                <dd>
                  <i className="swatch" style={{ background: corr?.hex }} />
                  {corr?.colour}
                </dd>
              </div>
              <div>
                <dt>Stone</dt>
                <dd>{corr?.stone}</dd>
              </div>
            </dl>
            <p className="note">
              The year card uses the same reduction with this year in place of your
              birth year. It changes every January, and it is the season you are
              reading your birth cards in — not a forecast for the year.
            </p>
          </div>
        </div>
      </section>
    </article>
  )
}
