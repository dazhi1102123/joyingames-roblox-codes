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

const HISTORY_KEY = "arcana:history"
const HISTORY_LIMIT = 200

/** Same store the reading board writes, so a draw taken from a question page
 *  shows up in /my-deck too. Only the cards, never the question. */
function remember(spreadName: string, drawn: Array<{ slug: string; reversed: boolean }>) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const history = raw ? JSON.parse(raw) : []
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(
        [{ at: Date.now(), spread: spreadName, cards: drawn }, ...(Array.isArray(history) ? history : [])]
          .slice(0, HISTORY_LIMIT),
      ),
    )
  } catch {
    // Private browsing or a full quota. Not a reason to fail the reading.
  }
}

/** The draw for one question page.
 *
 * The spread is fixed by the question rather than chosen by the visitor —
 * picking the spread is the part most people get wrong, and the page has
 * already made that choice on their behalf and explained it.
 */
export function QuestionReading({ spread, lens }: { spread: Spread; lens: string }) {
  const [reading, setReading] = useState<Reading | null>(null)
  const [detail, setDetail] = useState("")

  const draw = useCallback(() => {
    const drawn = drawCards(spread.count, true)
    setReading(composeReading(hydrate(drawn, spread), spread, detail.trim()))
    remember(spread.name, drawn)
  }, [spread, detail])

  // First draw after mount: crypto is not available while the server renders
  // the static HTML, and the page must stay static to be cacheable.
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
          <span className="eyebrow">
            Anything specific? (optional — it sharpens the reading)
          </span>
          <input
            type="text"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={160}
            placeholder="e.g. We stopped speaking in March and neither of us has said why."
          />
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

          <p className="lens">
            <strong>Reading it for this question.</strong> {lens}
          </p>

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
