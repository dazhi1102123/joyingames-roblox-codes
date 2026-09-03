import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CARDS, CONTEXTS, SUITS } from "@arcana/core"
import { CardFace } from "../../../card-face"
import { CONTEXT_LABEL } from "@/lib/pages"
import { canonical } from "@/lib/site"

type Params = { params: Promise<{ context: string }> }

/** The hub for one context.
 *
 * The footer has always linked here. These pages existed in the Flask build
 * only as a link, which meant every page on the site carried five 404s.
 */
export function generateStaticParams() {
  return CONTEXTS.filter((c) => c.slug !== "general").map((c) => ({ context: c.slug }))
}

const INTRO: Record<string, string> = {
  love:
    "A card in a relationship reading is rarely about whether someone loves you. " +
    "It is about the shape of the thing — who is holding what, what is being " +
    "avoided, what would change if one person moved first.",
  career:
    "Work questions arrive as decisions and turn out to be about something else: " +
    "what the role costs, what staying protects, what the money is standing in for.",
  money:
    "Nothing here forecasts an amount. What a card can describe is your relationship " +
    "to money — where it is being used as safety, as proof, or as a way of not " +
    "deciding something.",
  health:
    "Not diagnosis and not prognosis. What a card reads on is energy, attention and " +
    "the practices you keep postponing. Anything clinical belongs with a clinician.",
  "yes-no":
    "A single card can carry a direction, and this is the honest version of that: " +
    "the lean, the reasoning, and where the card refuses to commit.",
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { context } = await params
  const label = CONTEXT_LABEL.get(context)
  if (!label || context === "general") return {}
  return {
    title: `Tarot Meanings for ${label}`,
    description:
      `All 78 cards read for ${label.toLowerCase()} — upright and reversed. ` +
      `What each card says when the question is about ${label.toLowerCase()}.`,
    alternates: { canonical: canonical(`/cards/context/${context}`) },
  }
}

export default async function ContextHub({ params }: Params) {
  const { context } = await params
  const label = CONTEXT_LABEL.get(context)
  if (!label || context === "general") notFound()

  // Yes-or-no is carried by every card as a lean, not as a ctx paragraph, so
  // this hub groups by the answer rather than by arcana. Without this the page
  // listed nothing at all -- 78 cards have a yes/no direction and none of them
  // have card.ctx["yes-no"].
  if (context === "yes-no") return <YesNoHub />

  const groups = [
    { key: "major", label: "Major Arcana" },
    ...Object.entries(SUITS).map(([slug, suit]) => ({ key: slug, label: suit.name })),
  ]

  const covered = CARDS.filter((c) => c.ctx[context])

  return (
    <article className="prose-wide">
      <p className="eyebrow">{label}</p>
      <h1>Every card, read for {label.toLowerCase()}</h1>
      <p className="lede">{INTRO[context]}</p>
      <p className="note">
        {covered.length} of {CARDS.length} cards have a reading written for this
        context.
      </p>

      {groups.map((group) => {
        const cards = covered.filter((c) =>
          group.key === "major" ? c.arcana === "major" : c.suit === group.key,
        )
        if (!cards.length) return null
        return (
          <section key={group.key} className="deck-group">
            <h2>{group.label}</h2>
            <ul className="deck-grid">
              {cards.map((card) => (
                <li key={card.slug}>
                  <a href={`/cards/${card.slug}/${context}`}>
                    <CardFace slug={card.slug} />
                    <span className="cardname">{card.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <section>
        <h2>Other contexts</h2>
        <ul className="keys">
          {CONTEXTS.filter((c) => c.slug !== "general" && c.slug !== context).map((c) => (
            <li key={c.slug}>
              <a href={`/cards/context/${c.slug}`}>{c.label}</a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}

const LEAN = [
  {
    key: "yes",
    label: "Cards that read yes",
    note:
      "Movement, arrival, permission. A yes card says the thing you are asking " +
      "about has room to happen — not that it will happen without you.",
  },
  {
    key: "maybe",
    label: "Cards that refuse to commit",
    note:
      "The honest middle. These cards say the situation is still forming, and " +
      "that a yes or a no read out of them now would be invented.",
  },
  {
    key: "no",
    label: "Cards that read no",
    note:
      "Closure, blockage, or the wrong terms. A no is usually about the shape " +
      "of the question rather than the outcome — often it means not like this.",
  },
] as const

function YesNoHub() {
  return (
    <article className="prose-wide">
      <p className="eyebrow">Yes or no</p>
      <h1>Every card&rsquo;s yes-or-no lean</h1>
      <p className="lede">{INTRO["yes-no"]}</p>
      <p className="note">
        A single card carries a direction, not a verdict. Reversed, a yes softens to a
        maybe and a maybe hardens to a no — the card is describing how much room the
        situation has, which is the part a yes-or-no question usually leaves out.
      </p>

      {LEAN.map((lean) => {
        const cards = CARDS.filter((c) => c.yesno === lean.key)
        if (!cards.length) return null
        return (
          <section key={lean.key} className="deck-group">
            <h2>
              {lean.label} <span className="note">· {cards.length} cards</span>
            </h2>
            <p className="note">{lean.note}</p>
            <ul className="deck-grid">
              {cards.map((card) => (
                <li key={card.slug}>
                  <a href={`/cards/${card.slug}`}>
                    <CardFace slug={card.slug} />
                    <span className="cardname">{card.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <aside className="cta">
        <p>
          A one-card answer is the weakest reading in the deck. If the question matters,
          the reasoning matters more than the lean.
        </p>
        <a className="btn primary" href="/reading/yes-no">
          Draw a yes-or-no reading
        </a>
      </aside>

      <section>
        <h2>Other contexts</h2>
        <ul className="keys">
          {CONTEXTS.filter((c) => c.slug !== "general" && c.slug !== "yes-no").map((c) => (
            <li key={c.slug}>
              <a href={`/cards/context/${c.slug}`}>{c.label}</a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}
