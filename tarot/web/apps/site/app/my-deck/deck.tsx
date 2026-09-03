"use client"

import { useEffect, useState } from "react"
import { CARDS, cardBySlug } from "@arcana/core"
import { CardFace } from "../card-face"

/** Reading history, kept in localStorage.
 *
 * A history of what someone asked the cards is the most sensitive thing this
 * site could hold, so it is not held: it lives on the one device that made it.
 * That is also why there is no sync and no account -- both would mean storing
 * it somewhere we would then have to defend.
 */

const KEY = "arcana:history"
const LIMIT = 200

export interface Entry {
  at: number
  spread: string
  cards: Array<{ slug: string; reversed: boolean }>
}

export function readHistory(): Entry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, LIMIT) : []
  } catch {
    // Private browsing throws on access, and a corrupt value is not worth a
    // crash on a page whose whole job is to be reassuring.
    return []
  }
}

export function MyDeck() {
  const [entries, setEntries] = useState<Entry[] | null>(null)

  useEffect(() => setEntries(readHistory()), [])

  if (entries === null) return <p className="note">Reading your history…</p>

  if (!entries.length) {
    return (
      <>
        <p className="note">
          Nothing here yet. Draw a spread and it will appear — this page fills itself
          in as you use the site.
        </p>
        <div className="actions">
          <a className="btn primary" href="/reading/three-card">
            Draw three cards
          </a>
          <a className="btn" href="/reading/daily">
            Card of the day
          </a>
        </div>
      </>
    )
  }

  const counts = new Map<string, { up: number; rev: number }>()
  for (const entry of entries) {
    for (const card of entry.cards) {
      const tally = counts.get(card.slug) ?? { up: 0, rev: 0 }
      if (card.reversed) tally.rev++
      else tally.up++
      counts.set(card.slug, tally)
    }
  }

  const repeats = [...counts.entries()]
    .map(([slug, tally]) => ({ slug, ...tally, total: tally.up + tally.rev }))
    .filter((r) => r.total > 1)
    .sort((a, b) => b.total - a.total)

  const totalCards = entries.reduce((sum, e) => sum + e.cards.length, 0)

  return (
    <>
      <dl className="facts">
        <div>
          <dt>Readings</dt>
          <dd>{entries.length}</dd>
        </div>
        <div>
          <dt>Cards drawn</dt>
          <dd>{totalCards}</dd>
        </div>
        <div>
          <dt>Deck seen</dt>
          <dd>
            {counts.size} of {CARDS.length}
          </dd>
        </div>
      </dl>

      {repeats.length > 0 ? (
        <section>
          <h2>Cards that keep arriving</h2>
          <p className="note">
            Repetition across independent draws is chance, not a message — but which
            card you keep noticing is worth knowing.
          </p>
          <ul className="deck-grid">
            {repeats.map((r) => {
              const card = cardBySlug(r.slug)
              if (!card) return null
              return (
                <li key={r.slug}>
                  <a href={`/cards/${r.slug}`}>
                    <CardFace slug={r.slug} />
                    <span className="cardname">
                      {card.name}
                      <br />
                      <em className="mono">
                        ×{r.total}
                        {r.rev > 0 && ` · ${r.rev} rev`}
                      </em>
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </section>
      ) : (
        <p className="note">
          No card has come up twice yet. Come back after a few more readings.
        </p>
      )}

      <section>
        <h2>Recent readings</h2>
        <ul className="history">
          {entries.slice(0, 20).map((entry) => (
            <li key={entry.at}>
              <span className="mono">
                {new Date(entry.at).toLocaleString()} · {entry.spread}
              </span>
              <span className="line">
                {entry.cards.map((c, i) => (
                  <a key={i} href={`/cards/${c.slug}`}>
                    {cardBySlug(c.slug)?.name}
                    {c.reversed ? " (rev)" : ""}
                  </a>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="actions">
        <button
          className="btn"
          onClick={() => {
            if (!confirm("Delete every reading stored on this device? This cannot be undone.")) return
            try {
              localStorage.removeItem(KEY)
            } catch {
              /* nothing to remove if storage was never readable */
            }
            setEntries([])
          }}
        >
          Delete my history
        </button>
      </div>
    </>
  )
}
