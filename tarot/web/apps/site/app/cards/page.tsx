import type { Metadata } from "next"
import { CARDS, SUITS } from "@arcana/core"
import { CardFace } from "../card-face"

export const metadata: Metadata = {
  title: "All 78 Tarot Card Meanings",
  description:
    "Every card in the deck, upright and reversed, with meanings for love, " +
    "career, money, health and yes-or-no questions.",
  alternates: { canonical: "/cards" },
}

const GROUPS = [
  { key: "major", label: "Major Arcana", note: "The 22 cards of the larger pattern." },
  ...Object.entries(SUITS).map(([slug, suit]) => ({
    key: slug,
    label: suit.name,
    note: `${suit.element} — ${suit.domain}.`,
  })),
]

export default function CardsIndex() {
  return (
    <article className="prose-wide">
      <p className="eyebrow">The deck</p>
      <h1>All 78 cards</h1>
      <p className="lede">
        Each card has its own page with upright and reversed meanings across five
        contexts. Start anywhere — the major arcana carry the larger themes, the
        four suits carry the daily ones.
      </p>

      {GROUPS.map((group) => {
        const cards = CARDS.filter((c) =>
          group.key === "major" ? c.arcana === "major" : c.suit === group.key,
        )
        return (
          <section key={group.key} className="deck-group">
            <h2>{group.label}</h2>
            <p className="note">{group.note}</p>
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
    </article>
  )
}
