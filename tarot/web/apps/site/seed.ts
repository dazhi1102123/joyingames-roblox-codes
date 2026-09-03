/** Seed example readers and one order at each stage of the flow.
 *
 *     pnpm seed
 *
 * Mirrors tarot/seed_readers.py and seed_demo.py so both builds look the same
 * when you open them. Idempotent: re-running skips readers that already exist.
 */

import { addReader, listReaders } from "./lib/readers"
import { createOrder, setPayment, setStatus } from "./lib/orders"
import { CONSENT_TEXT, confirmSubscriber, subscribe } from "./lib/subscribers"
import { SPREADS, drawCards } from "@arcana/core"

const READERS = [
  {
    slug: "maren-voss",
    name: "Maren Voss",
    tagline: "Career, and the decisions underneath them.",
    bio: "Fifteen years reading for people at turning points. Direct, structured, no flattery.",
    approach:
      "I read position-first and tell you what the spread says, including the parts you did not ask about.",
    specialties: ["Career", "Decisions", "Burnout"],
    price_cents: 4500,
    turnaround_h: 48,
    capacity: 5,
  },
  {
    slug: "ines-caldeira",
    name: "Inês Caldeira",
    tagline: "Relationships, without the fortune-telling.",
    bio: "Reads relationships as patterns rather than predictions. Warm, but will not tell you what you want to hear.",
    approach: "Long-form. Expect eight hundred words and at least one uncomfortable observation.",
    specialties: ["Relationships", "Family", "Grief"],
    price_cents: 5500,
    turnaround_h: 72,
    capacity: 4,
  },
  {
    slug: "theo-brandt",
    name: "Theo Brandt",
    tagline: "Quick, practical readings for a specific question.",
    bio: "Short readings for people who want an answer, not an essay.",
    approach: "Three cards, four hundred words, delivered same day where possible.",
    specialties: ["Yes / no", "Timing", "Money"],
    price_cents: 3500,
    turnaround_h: 24,
    capacity: 8,
  },
]

function main() {
  if (listReaders(false).length === 0) {
    for (const r of READERS) {
      const reader = addReader(r)
      console.log(
        `  + ${reader.name.padEnd(18)} €${reader.price} → €${reader.payout} to reader (margin €${reader.margin})`,
      )
      console.log(`${" ".repeat(23)}/desk key: ${reader.access_key}`)
    }
    console.log("\nKeep these keys out of version control. Rotate by re-issuing the reader.\n")
  } else {
    for (const r of listReaders(false)) console.log(`  = ${r.slug} already exists, skipped`)
  }

  const readers = listReaders(false)
  const spread = SPREADS["situation"]

  const make = (i: number, situation: string) =>
    createOrder(readers[i], {
      focus: "career",
      situation,
      tried: "",
      birth_ymd: "",
      spread_slug: spread.slug,
      drawn: drawCards(spread.count, true),
    })

  const delivered = make(
    0,
    "I have been offered a role that pays more but means leaving a team I built. I keep going back and forth.",
  )
  setPayment(delivered, "paid")
  setStatus(delivered, "claimed", { readerId: readers[0].id })
  setStatus(delivered, "delivered", {
    readerId: readers[0].id,
    reading:
      "**Situation — The Chariot, upright.** You are already moving; the question is whether you are steering.\n\n" +
      "**Action — Four of Cups, reversed.** The offer is finally being seen for what it is.\n\n" +
      "**Outcome — Two of Pentacles, upright.** Whichever you take, the next year is juggling. Pick the one whose juggling you respect.",
  })

  const waiting = make(
    1,
    "My sister and I have not spoken in two years and I do not know who is supposed to move first.",
  )
  setPayment(waiting, "paid")

  make(2, "Should I put the deposit down this month or wait until the spring?")

  console.log("  + 1 delivered, 1 waiting, 1 unpaid order")
  console.log(`    delivered order: /order/${delivered}`)

  for (const email of ["ada@example.test", "bo@example.test", "cy@example.test"]) {
    const t = subscribe(email, "seed", CONSENT_TEXT, "127.0.0.1")
    if (t) confirmSubscriber(t, "127.0.0.1")
  }
  subscribe("pending@example.test", "seed", CONSENT_TEXT, "127.0.0.1")
  console.log("  + 3 confirmed subscribers, 1 pending")
}

main()
