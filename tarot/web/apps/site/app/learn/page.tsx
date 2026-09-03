import type { Metadata } from "next"
import { CONTEXTS, SPREADS, SUITS } from "@arcana/core"
import { canonical } from "@/lib/site"

export const metadata: Metadata = {
  title: "How to Read Tarot",
  description:
    "How a tarot reading actually works: position before card, the spread as a " +
    "whole, what reversals mean, and what a reading cannot do.",
  alternates: { canonical: canonical("/learn") },
}

export default function Learn() {
  return (
    <article className="prose-wide">
      <p className="eyebrow">Learn</p>
      <h1>How to read tarot</h1>
      <p className="lede">
        Not a course. Four things that separate a reading that tells you something
        from a reading that tells you what you already decided.
      </p>

      <section>
        <h2>1. Position decides what the card is answering</h2>
        <p>
          This is the whole craft, and it is what most free tarot sites skip. The Tower
          in <em>outcome</em> means something different from The Tower in{" "}
          <em>what is passing</em> — the first says a structure is going to give, the
          second says one already did and you are past it. The card supplies a shape;
          the position supplies the question. A card meaning read without its position
          is a definition, not a reading.
        </p>
      </section>

      <section>
        <h2>2. The spread is a single statement</h2>
        <p>
          Read the pattern, not just the cards. How many major arcana — a spread that
          is mostly major describes something structural, one with none describes
          something with practical levers. Which suit dominates tells you the register
          the answer lives in:
        </p>
        <dl className="positions">
          {Object.entries(SUITS).map(([slug, suit]) => (
            <div key={slug}>
              <dt>
                {suit.name} · {suit.element}
              </dt>
              <dd>{suit.domain}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2>3. Reversed is not opposite</h2>
        <p>
          A reversed card is usually the same energy blocked, internalised or badly
          timed — rarely its absence, and almost never its opposite. Reversed Strength
          is not weakness; it is force applied to the wrong thing, or restraint that
          has become avoidance. If a reversal reads as a simple negation, the reading
          has stopped saying anything.
        </p>
      </section>

      <section>
        <h2>4. What a reading cannot do</h2>
        <p>
          It cannot tell you what will happen. It has no access to events, and any
          reading that claims otherwise is either performing or selling. What it can do
          is describe a situation you are already inside more precisely than you were
          describing it yourself — which is genuinely useful, and is a different claim.
        </p>
        <p>
          Nothing in a reading is medical, legal or financial advice. For those, ask
          someone qualified to give it.
        </p>
      </section>

      <section>
        <h2>Choosing a spread</h2>
        <p>
          Picking the wrong spread is the most common reason a reading feels vague. One
          card answers a narrow question; ten cards on a narrow question produce ten
          ways of saying the same thing.
        </p>
        <dl className="positions">
          {Object.values(SPREADS).map((s) => (
            <div key={s.slug}>
              <dt>
                <a href={`/reading/${s.slug}`}>{s.name}</a> — {s.count} card
                {s.count > 1 ? "s" : ""}
              </dt>
              <dd>{s.blurb}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2>Reading by question</h2>
        <p>
          Every card has a page per context, because &ldquo;what does this card
          mean&rdquo; and &ldquo;what does it mean about my relationship&rdquo; are not
          the same question.
        </p>
        <ul className="keys">
          {CONTEXTS.filter((c) => c.slug !== "general").map((c) => (
            <li key={c.slug}>
              <a href={`/cards/context/${c.slug}`}>{c.label}</a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}
