"use client"

import { useCallback, useEffect, useState } from "react"
import {
  composeReading,
  drawCards,
  hydrate,
  renderMarkdown,
  type Reading,
  type Spread,
} from "@arcana/core"
import { CardFace } from "../../card-face"

/** The draw happens in the browser, on purpose.
 *
 * Every visitor must get a different spread, so this route can never be
 * cached with a reading baked in. Drawing client-side keeps the page itself
 * fully static -- the CDN serves one HTML file to everyone and the randomness
 * costs no server call at all.
 */
export function ReadingBoard({ spread }: { spread: Spread }) {
  const [reading, setReading] = useState<Reading | null>(null)
  const [question, setQuestion] = useState("")
  const [reversals, setReversals] = useState(true)

  const draw = useCallback(() => {
    const drawn = drawCards(spread.count, reversals)
    setReading(composeReading(hydrate(drawn, spread), spread, question.trim()))
  }, [spread, reversals, question])

  // First draw after mount, never during render -- crypto is not available
  // while the server is producing the static HTML.
  useEffect(() => {
    setReading((current) => current ?? composeReading(
      hydrate(drawCards(spread.count, true), spread), spread, "",
    ))
  }, [spread])

  return (
    <div className="board">
      <div className="controls">
        <label>
          <span className="eyebrow">Your question (optional — the reading is sharper with one)</span>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Should I stay in this job another year?"
            maxLength={160}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={reversals}
            onChange={(e) => setReversals(e.target.checked)}
          />
          Include reversals
        </label>
        <button className="btn primary" onClick={draw}>
          Shuffle &amp; draw{reading ? " again" : ""}
        </button>
      </div>

      {reading && (
        <>
          <ol className="spread-grid" data-count={spread.count}>
            {reading.cards.map((entry, i) => (
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
        </>
      )}
    </div>
  )
}
