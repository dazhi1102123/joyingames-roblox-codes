import type { Metadata } from "next"
import { CARDS, SPREADS } from "@arcana/core"
import { QUESTIONS } from "@/lib/questions"
import { CardFace } from "./card-face"
import { SITE } from "@/lib/site"

export const metadata: Metadata = {
  title: `${SITE.name} — Free Tarot Reading, Interpreted Properly`,
  description: SITE.description,
  alternates: { canonical: "/" },
}

// The fan on the hero. Fixed cards, so the page stays statically rendered --
// a random hero would force this route dynamic and cost the CDN cache.
const FAN = ["the-star", "the-tower", "the-sun", "the-moon"]

// One from each area, so the row reads as a range rather than a category.
const FRONT_SLUGS = [
  "does-he-still-have-feelings",
  "should-i-quit-my-job",
  "why-do-i-keep-repeating-this",
  "why-am-i-always-broke",
  "should-i-forgive-them",
]
const FRONT_QUESTIONS = FRONT_SLUGS
  .map((slug) => QUESTIONS.find((q) => q.slug === slug))
  .filter((q): q is (typeof QUESTIONS)[number] => Boolean(q))

export default function Home() {
  const spreads = Object.values(SPREADS)
  const meanings = CARDS.length * 2 * 3 // upright + reversed, across contexts

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Free · No signup · No card limit</p>
          <h1>{SITE.tagline}</h1>
          <p className="lede">
            Most free tarot sites hand you a card and a paragraph written years ago
            about that card in general. This one reads your cards in their
            positions, against your question, and tells you what the spread says as
            a whole — including the parts you might not want to hear.
          </p>
          <div className="actions">
            <a className="btn primary" href="/reading/three-card">
              Draw three cards
            </a>
            <a className="btn" href="/reading/daily">
              Card of the day
            </a>
          </div>
          <p className="stat">
            {CARDS.length} cards · {spreads.length} spreads · {meanings} card meanings
            <br />
            Nothing to install. Nothing to pay. No email required.
          </p>
        </div>
        <div className="fan" aria-hidden="true">
          {FAN.map((slug, i) => (
            <div key={slug} className="fan-card" data-i={i}>
              <CardFace slug={slug} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="eyebrow">Start from the question</p>
        <h2>Most people do not arrive thinking in cards.</h2>
        <p className="lede">
          They arrive with a question — should I quit, is there a way back, why does
          this keep happening. Each of these binds the question to the spread that
          suits it, and says plainly what the reading cannot tell you.
        </p>
        <ul className="question-list">
          {FRONT_QUESTIONS.map((q) => (
            <li key={q.slug}>
              <a href={`/questions/${q.slug}`}>{q.title}</a>
              <span className="mono">{SPREADS[q.spread].name}</span>
            </li>
          ))}
        </ul>
        <div className="actions">
          <a className="btn" href="/questions">
            All {QUESTIONS.length} questions
          </a>
        </div>
      </section>

      <section className="band">
        <p className="eyebrow">Choose a spread</p>
        <h2>Start with the question, not the cards.</h2>
        <p className="lede">
          The spread decides what kind of answer you get. One card for a nudge,
          three for a trajectory, ten when the situation has layers.
        </p>
        <div className="grid spreads">
          {spreads.map((s) => (
            <a key={s.slug} className="tile" href={`/reading/${s.slug}`}>
              <h3>{s.name}</h3>
              <p>{s.blurb}</p>
              <footer>
                <span className="pips" aria-hidden="true">
                  {Array.from({ length: 10 }, (_, i) => (
                    <i key={i} className={i < s.count ? "on" : ""} />
                  ))}
                </span>
                <span className="count">
                  {s.count} card{s.count > 1 ? "s" : ""} →
                </span>
              </footer>
            </a>
          ))}
        </div>
      </section>

      <section>
        <p className="eyebrow">What makes a reading useful</p>
        <h2>Three things this site does differently.</h2>
        <div className="grid three">
          <article className="tile">
            <h3>Position before card</h3>
            <p>
              The Tower in <em>outcome</em> means something different from The Tower
              in <em>what is passing</em>. Readings here are built position-first,
              which is how a reader actually works.
            </p>
          </article>
          <article className="tile">
            <h3>The spread as a whole</h3>
            <p>
              Every reading ends by looking at the pattern — how many major arcana,
              which suit dominates, how much is reversed. That synthesis is usually
              where the answer is.
            </p>
          </article>
          <article className="tile">
            <h3>An honest shuffle</h3>
            <p>
              Cards are drawn with your device&rsquo;s cryptographic random number
              generator, not a seeded shuffle. It&rsquo;s the one mechanic
              you&rsquo;re entitled to be suspicious about, so we say plainly how it
              works.
            </p>
          </article>
        </div>
      </section>

      <section className="band">
        <p className="eyebrow">The deck</p>
        <h2>All 78 cards, upright and reversed.</h2>
        <p className="lede">
          Every card has a page for love, career, money, health and yes-or-no
          questions — because &ldquo;what does The Moon mean&rdquo; and &ldquo;what
          does The Moon mean about my relationship&rdquo; are not the same question.
        </p>
        <div className="actions">
          <a className="btn" href="/cards">
            Browse the deck
          </a>
          <a className="btn" href="/spreads">
            Compare spreads
          </a>
        </div>
      </section>
    </>
  )
}
