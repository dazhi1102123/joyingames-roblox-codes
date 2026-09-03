import type { Metadata } from "next"
import { SPREADS } from "@arcana/core"

export const metadata: Metadata = {
  title: "Tarot Spreads Explained",
  description:
    "Which tarot spread to use, and what each position actually asks. One card " +
    "for a nudge, three for a trajectory, ten when the situation has layers.",
  alternates: { canonical: "/spreads" },
}

export default function Spreads() {
  return (
    <article className="prose-wide">
      <p className="eyebrow">Spreads</p>
      <h1>Which spread, and why</h1>
      <p className="lede">
        The spread decides what kind of answer you get. Picking the wrong one is
        the most common reason a reading feels vague.
      </p>

      {Object.values(SPREADS).map((spread) => (
        <section key={spread.slug} className="spread-explainer">
          <h2>
            <a href={`/reading/${spread.slug}`}>{spread.name}</a>
          </h2>
          <p className="note">
            {spread.count} card{spread.count > 1 ? "s" : ""} — {spread.blurb}
          </p>
          <dl className="positions">
            {spread.positions.map((p) => (
              <div key={p.name}>
                <dt>{p.name}</dt>
                <dd>{p.note}</dd>
              </div>
            ))}
          </dl>
          <a className="btn" href={`/reading/${spread.slug}`}>
            Draw this spread →
          </a>
        </section>
      ))}
    </article>
  )
}
