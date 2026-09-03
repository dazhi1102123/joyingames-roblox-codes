import type { Metadata } from "next"
import { BirthTool } from "./tool"
import { canonical } from "@/lib/site"

export const metadata: Metadata = {
  title: "Find Your Tarot Birth Card",
  description:
    "Your personality and soul cards, worked out from your birth date by the " +
    "standard digit reduction — with the card for the current year.",
  alternates: { canonical: canonical("/birth-card") },
}

export default function BirthCard() {
  return (
    <article className="prose-wide">
      <p className="eyebrow">Birth card</p>
      <h1>Your birth cards</h1>
      <p className="lede">
        Tarot has no natal chart, so this is the closest thing it has to one: add the
        month, day and year, reduce by digit sum until the number is 22 or less, and
        read the major arcana it lands on.
      </p>
      <BirthTool />

      <section>
        <h2>What the two cards mean</h2>
        <p>
          The <strong>personality card</strong> is the one people meet — how you
          operate, and what you reach for under pressure. The{" "}
          <strong>soul card</strong> sits underneath it: the same energy at a
          different depth, and the thing the personality card is usually in service
          of.
        </p>
        <p>
          Some birth dates produce one card rather than two. That happens when the
          reduction lands on a single digit, which is its own soul number — it is not
          a missing result.
        </p>
        <p>
          The <strong>year card</strong> uses the same method with the current year in
          place of your birth year. It is the season you are reading your birth cards
          in, and it changes every January.
        </p>
      </section>

      <aside className="disclaimer">
        <strong>A structure, not a fate.</strong> A birth card is a lens for looking at
        how you tend to work, arrived at by arithmetic on a date. It does not describe
        what will happen to you.
      </aside>
    </article>
  )
}
