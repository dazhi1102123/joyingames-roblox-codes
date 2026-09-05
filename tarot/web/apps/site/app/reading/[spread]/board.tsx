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
import { FollowUps } from "../../follow-ups"

/** The draw happens in the browser, on purpose.
 *
 * Every visitor must get a different spread, so this route can never be
 * cached with a reading baked in. Drawing client-side keeps the page itself
 * fully static -- the CDN serves one HTML file to everyone and the randomness
 * costs no server call at all.
 */
const HISTORY_KEY = "arcana:history"
const HISTORY_LIMIT = 200

/** Keep the draw in this browser so /my-deck has something to show.
 *
 * The question is deliberately not stored. What someone asked the cards is the
 * sensitive half, and the page only needs which cards came up.
 */
function remember(spreadName: string, drawn: Array<{ slug: string; reversed: boolean }>) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const history = raw ? JSON.parse(raw) : []
    const next = [
      { at: Date.now(), spread: spreadName, cards: drawn },
      ...(Array.isArray(history) ? history : []),
    ].slice(0, HISTORY_LIMIT)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch {
    // Private browsing, a full quota, or storage switched off. None of those
    // are a reason to fail the reading the visitor actually asked for.
  }
}

export function ReadingBoard({ spread }: { spread: Spread }) {
  const [reading, setReading] = useState<Reading | null>(null)
  const [question, setQuestion] = useState("")
  const [reversals, setReversals] = useState(true)

  const draw = useCallback(() => {
    const drawn = drawCards(spread.count, reversals)
    setReading(composeReading(hydrate(drawn, spread), spread, question.trim()))
    remember(spread.name, drawn)
  }, [spread, reversals, question])

  // First draw after mount, never during render -- crypto is not available
  // while the server is producing the static HTML.
  useEffect(() => {
    setReading((current) => {
      if (current) return current
      const drawn = drawCards(spread.count, true)
      remember(spread.name, drawn)
      return composeReading(hydrate(drawn, spread), spread, "")
    })
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

          <FollowUps reading={reading} />
        </>
      )}
    </div>
  )
}
