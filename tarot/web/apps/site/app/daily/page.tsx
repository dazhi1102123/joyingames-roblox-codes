import type { Metadata } from "next"
import { CORRESPONDENCES, briefFor, cardOfTheDay } from "@arcana/core"
import { CardFace } from "../card-face"
import { canonical } from "@/lib/site"

export const metadata: Metadata = {
  title: "Card of the Day",
  description:
    "One card for today, the same for everyone, with what to watch for and the " +
    "colour and stone traditionally associated with it.",
  alternates: { canonical: canonical("/daily") },
}

/** Rebuilt hourly so the card turns over at midnight without a deploy.
 *  Same card for every visitor -- a "card of the day" that differs per person
 *  is not a day's card, it is a draw with a misleading name. */
export const revalidate = 3600

export default function Daily() {
  const card = cardOfTheDay()
  const brief = briefFor(card, false)
  const corr = CORRESPONDENCES[card.slug]

  return (
    <article className="prose-wide">
      <p className="eyebrow">Today</p>
      <h1>{card.name}</h1>

      <div className="card-layout">
        <aside>
          <CardFace slug={card.slug} className="large" priority />
          <dl className="facts">
            <div>
              <dt>Element</dt>
              <dd>{card.element}</dd>
            </div>
            <div>
              <dt>Lucky colour</dt>
              <dd>
                <i className="swatch" style={{ background: corr?.hex }} />
                {corr?.colour}
              </dd>
            </div>
            <div>
              <dt>Stone</dt>
              <dd>{corr?.stone}</dd>
            </div>
            <div>
              <dt>Metal</dt>
              <dd>{corr?.metal}</dd>
            </div>
          </dl>
        </aside>

        <div className="card-body">
          <p className="lede">{card.up}</p>

          <h2 className="label">What to watch</h2>
          <p>{brief.watch}</p>

          <h2 className="label">Where the colour comes from</h2>
          <p>
            {corr?.source}. Traditional associations, not remedies — a stone
            associated with a card is not a treatment for anything, and nothing here
            will protect you from anything.
          </p>

          <aside className="cta">
            <p>
              The same card for everyone today. If you want one drawn for your own
              question instead, that is a different thing.
            </p>
            <a className="btn primary" href="/reading/daily">
              Draw your own
            </a>
          </aside>

          <p>
            <a href={`/cards/${card.slug}`}>Read {card.name} in full →</a>
          </p>
        </div>
      </div>
    </article>
  )
}
