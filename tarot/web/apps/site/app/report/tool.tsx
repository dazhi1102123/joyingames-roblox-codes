"use client"

import { useState } from "react"
import {
  SPREADS,
  birthCards,
  briefFor,
  composeReading,
  drawCards,
  hydrate,
  renderMarkdown,
  yearCard,
  type Reading,
} from "@arcana/core"
import { CardFace } from "../card-face"

/** The intake and the report, both in the browser.
 *
 * Nothing typed here is sent anywhere. The draw, the reading and the
 * correspondence brief are all computed locally, which is a stronger privacy
 * position than a promise not to store it -- there is nothing to store. The
 * email capture that belongs at the end of this funnel is deliberately absent
 * until the Impressum fields are filled and there is somewhere lawful to put
 * an address.
 */

const FOCUS = [
  {
    key: "love",
    label: "Love & relationships",
    spread: "relationship",
    note: "Someone specific, or the pattern across several.",
  },
  {
    key: "career",
    label: "Work & direction",
    spread: "situation",
    note: "A role, a move, or the question of whether to stay.",
  },
  {
    key: "money",
    label: "Money & security",
    spread: "situation",
    note: "Not a forecast — the shape of your relationship to it.",
  },
  {
    key: "decision",
    label: "A decision",
    spread: "situation",
    note: "Two options, or one you keep not making.",
  },
  {
    key: "general",
    label: "Something else",
    spread: "three-card",
    note: "No category. Say it in your own words.",
  },
] as const

const SITUATION_MAX = 400

interface Result {
  focusLabel: string
  situation: string
  tried: string
  reading: Reading
  brief: ReturnType<typeof briefFor>
  birth: {
    label: string
    personality: ReturnType<typeof birthCards>["personality"]
    soul: ReturnType<typeof birthCards>["soul"]
    same: boolean
    year: ReturnType<typeof yearCard>
  } | null
}

export function ReportTool() {
  const [focus, setFocus] = useState<string>("general")
  const [situation, setSituation] = useState("")
  const [tried, setTried] = useState("")
  const [birthday, setBirthday] = useState("")
  const [result, setResult] = useState<Result | null>(null)

  function build(event: React.FormEvent) {
    event.preventDefault()
    const chosen = FOCUS.find((f) => f.key === focus) ?? FOCUS[4]
    const spread = SPREADS[chosen.spread]

    const drawn = hydrate(drawCards(spread.count, true), spread)
    const clean = (s: string) => s.split(/\s+/).join(" ").trim().slice(0, SITUATION_MAX)
    const reading = composeReading(drawn, spread, clean(situation))

    // The palette comes from the card carrying the most weight: the last
    // position, which is where a linear spread lands.
    const anchor = drawn[drawn.length - 1]

    let birth: Result["birth"] = null
    const match = birthday.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (match) {
      const [, y, m, d] = match.map(Number) as unknown as [string, number, number, number]
      const { personality, soul } = birthCards(y, m, d)
      birth = {
        label: new Date(birthday).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        personality,
        soul,
        same: personality.slug === soul.slug,
        year: yearCard(new Date().getFullYear(), m, d),
      }
    }

    setResult({
      focusLabel: chosen.label,
      situation: clean(situation),
      tried: clean(tried),
      reading,
      brief: briefFor(anchor.card, anchor.reversed),
      birth,
    })
    // The report is long; put the reader at the top of it.
    requestAnimationFrame(() =>
      document.getElementById("report")?.scrollIntoView({ behavior: "smooth" }),
    )
  }

  return (
    <>
      <form className="order-form" onSubmit={build}>
        <fieldset className="focus">
          <legend className="eyebrow">What is this about?</legend>
          {FOCUS.map((f) => (
            <label key={f.key} className={focus === f.key ? "on" : ""}>
              <input
                type="radio"
                name="focus"
                value={f.key}
                checked={focus === f.key}
                onChange={() => setFocus(f.key)}
              />
              <span>
                <strong>{f.label}</strong>
                <em>{f.note}</em>
              </span>
            </label>
          ))}
        </fieldset>

        <label>
          <span className="eyebrow">The situation</span>
          <textarea
            rows={5}
            maxLength={SITUATION_MAX}
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="What is going on, and what do you want to understand about it?"
          />
          <span className="note">
            {situation.length}/{SITUATION_MAX}
          </span>
        </label>

        <label>
          <span className="eyebrow">What have you already tried?</span>
          <textarea
            rows={3}
            maxLength={SITUATION_MAX}
            value={tried}
            onChange={(e) => setTried(e.target.value)}
            placeholder="Optional. It stops the reading suggesting what you have already ruled out."
          />
        </label>

        <label>
          <span className="eyebrow">Birth date (optional — adds your birth cards)</span>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
        </label>

        <button className="btn primary" type="submit">
          {result ? "Draw a new report" : "Draw my report"}
        </button>

        <p className="note">
          Everything here is computed in your browser. Nothing you type is sent to us,
          so there is nothing for us to keep.
        </p>
      </form>

      {result && (
        <section id="report" className="report">
          <p className="eyebrow">Your report · {result.focusLabel}</p>
          <h2>{result.reading.spread.name}</h2>

          {result.situation && (
            <blockquote className="asked">{result.situation}</blockquote>
          )}

          <ol className="spread-grid" data-count={result.reading.cards.length}>
            {result.reading.cards.map((entry, i) => (
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

          <div className="interpretation">
            {result.reading.passages.map((p, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: renderMarkdown(p) }} />
            ))}
          </div>

          <section className="brief">
            <h3>Your colour and stone</h3>
            <p className="note">
              From {result.brief.card.name}, the card in the closing position.
            </p>
            <dl className="facts">
              <div>
                <dt>Colour</dt>
                <dd>
                  <i className="swatch" style={{ background: result.brief.hex }} />
                  {result.brief.colour}
                </dd>
              </div>
              <div>
                <dt>Stone</dt>
                <dd>{result.brief.stone}</dd>
              </div>
              <div>
                <dt>Metal</dt>
                <dd>{result.brief.metal}</dd>
              </div>
              <div>
                <dt>Attribution</dt>
                <dd>{result.brief.source}</dd>
              </div>
            </dl>
            <p>{result.brief.watch}</p>
            <p className="note">
              Traditional associations, not remedies. A stone associated with a card is
              not a treatment for anything.
            </p>
          </section>

          {result.birth && (
            <section className="brief">
              <h3>Your birth cards</h3>
              <p className="note">{result.birth.label}</p>
              <ul className="neighbours">
                <li>
                  <a href={`/cards/${result.birth.personality.slug}`}>
                    <CardFace slug={result.birth.personality.slug} />
                    <span>
                      {result.birth.personality.name}
                      <br />
                      <em>personality</em>
                    </span>
                  </a>
                </li>
                {!result.birth.same && (
                  <li>
                    <a href={`/cards/${result.birth.soul.slug}`}>
                      <CardFace slug={result.birth.soul.slug} />
                      <span>
                        {result.birth.soul.name}
                        <br />
                        <em>soul</em>
                      </span>
                    </a>
                  </li>
                )}
                <li>
                  <a href={`/cards/${result.birth.year.slug}`}>
                    <CardFace slug={result.birth.year.slug} />
                    <span>
                      {result.birth.year.name}
                      <br />
                      <em>this year</em>
                    </span>
                  </a>
                </li>
              </ul>
              <p className="note">
                {result.birth.same
                  ? "Your personality and soul cards are the same, which happens when the reduction lands on a single digit."
                  : "The personality card is how you operate; the soul card sits underneath it."}
              </p>
            </section>
          )}

          <aside className="disclaimer">
            <strong>For entertainment and reflection.</strong> This report is a
            structured way of looking at a situation you are already in. It is not
            advice and it does not predict what will happen.
          </aside>
        </section>
      )}
    </>
  )
}
