import type { Metadata } from "next"
import { SPREADS } from "@arcana/core"
import { AREAS, QUESTIONS, questionsInArea, type Question } from "@/lib/questions"
import { canonical } from "@/lib/site"

export const metadata: Metadata = {
  title: "Tarot by the Question You Actually Have",
  description:
    "Readings arranged by the question people actually ask — should I quit, is " +
    "there a way back, why does this keep happening — each with the spread that " +
    "answers it and a plain account of what it cannot tell you.",
  alternates: { canonical: canonical("/questions") },
}

export default function Questions() {
  const areas = Object.keys(AREAS) as Array<Question["area"]>

  return (
    <article className="prose-wide">
      <p className="eyebrow">By question</p>
      <h1>Start from the question, not the deck</h1>
      <p className="lede">
        The rest of this site is organised the way a deck is — by card, by suit, by
        spread. Nobody arrives thinking in those terms. These pages are arranged the
        way the question actually turns up, each bound to the spread that suits it.
      </p>
      <p className="note">
        Every one of them says plainly what the reading cannot do. That is not
        throat-clearing: a page promising to tell you what someone else is thinking
        is selling certainty it does not have.
      </p>

      {areas.map((area) => (
        <section key={area} className="deck-group">
          <h2>{AREAS[area].label}</h2>
          <p className="note">{AREAS[area].note}</p>
          <ul className="question-list">
            {questionsInArea(area).map((q) => (
              <li key={q.slug}>
                <a href={`/questions/${q.slug}`}>{q.title}</a>
                <span className="mono">
                  {SPREADS[q.spread].name} · {SPREADS[q.spread].count} card
                  {SPREADS[q.spread].count > 1 ? "s" : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <aside className="disclaimer">
        <strong>{QUESTIONS.length} questions, and none of them predictive.</strong> A
        tarot reading is a structured way of looking at a situation you are already
        in. For anything medical, legal or financial, ask someone qualified.
      </aside>
    </article>
  )
}
