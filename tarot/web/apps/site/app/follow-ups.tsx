"use client"

import { useState } from "react"
import {
  FOLLOW_UP_QUESTIONS,
  followUp,
  renderMarkdown,
  type FollowUp,
  type Reading,
} from "@arcana/core"

/** Follow-up questions against a reading already on the table.
 *
 * The second question is usually the real one; the first is what someone felt
 * able to type. Each follow-up re-reads the same cards through a different
 * lens rather than drawing again — drawing again would answer a different
 * question.
 *
 * The free allowance is a real limit rather than a nag: the answers cost
 * nothing to serve, but a reading that never ends stops being a reading. What
 * sits past the limit is a person, not a hidden tier — there is no checkout
 * for a plan that does not exist yet, and inventing one would be a promise the
 * site cannot keep.
 */

const FREE_FOLLOW_UPS = Number(process.env.NEXT_PUBLIC_FREE_FOLLOW_UPS ?? "1")

export function FollowUps({ reading }: { reading: Reading }) {
  const [asked, setAsked] = useState<FollowUp[]>([])

  const remaining = Math.max(0, FREE_FOLLOW_UPS - asked.length)
  const unasked = FOLLOW_UP_QUESTIONS.filter(
    (q) => !asked.some((a) => a.key === q.key),
  )

  function ask(key: string) {
    const answer = followUp(reading, key)
    if (answer) setAsked((current) => [...current, answer])
  }

  if (!unasked.length && !asked.length) return null

  return (
    <section className="followups">
      <h2>Ask it something else</h2>

      {asked.map((a) => (
        <article key={a.key} className="followup">
          <h3>{a.question}</h3>
          <p dangerouslySetInnerHTML={{ __html: renderMarkdown(a.answer) }} />
        </article>
      ))}

      {remaining > 0 && unasked.length > 0 && (
        <>
          <p className="note">
            {asked.length === 0
              ? "The same cards, read for a different question."
              : `${remaining} more included with this reading.`}
          </p>
          <div className="actions">
            {unasked.map((q) => (
              <button key={q.key} className="btn" onClick={() => ask(q.key)}>
                {q.question}
              </button>
            ))}
          </div>
        </>
      )}

      {remaining === 0 && unasked.length > 0 && (
        <aside className="cta">
          <p>
            <strong>That is the free follow-up used.</strong> The remaining
            {unasked.length === 1 ? " question is" : ` ${unasked.length} questions are`}{" "}
            still readable from these cards — a reader will do it properly, against
            what you actually tell them, rather than through a fixed lens.
          </p>
          <a className="btn primary" href="/readers">
            Ask a person
          </a>
        </aside>
      )}
    </section>
  )
}
