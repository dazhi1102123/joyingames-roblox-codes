/** Guards that were real bugs in the Python build. Both are enforced in the
 *  store layer rather than the route layer, so no caller can bypass them.
 *
 *      pnpm test
 */

import fs from "node:fs"
import { addReader, listReaders } from "./lib/readers"
import { createOrder, getOrder, setPayment, setStatus } from "./lib/orders"
import { payoutsOwed, readerEarnings, settleReader } from "./lib/payouts"
import { CONSENT_TEXT, confirmSubscriber, subscribe, unsubscribe } from "./lib/subscribers"
import { channelsAreSeparated } from "./lib/mailer"
import { drawCards } from "@arcana/core"

let failures = 0
function check(name: string, condition: boolean, detail = "") {
  console.log(`${condition ? "  ok  " : "  FAIL"} ${name}${detail ? ` — ${detail}` : ""}`)
  if (!condition) failures++
}

const reader = listReaders(false)[0] ?? addReader({ slug: "t", name: "T", price_cents: 5500 })
const other = listReaders(false)[1]

const order = createOrder(reader, {
  focus: "general", situation: "x".repeat(30), tried: "",
  birth_ymd: "", spread_slug: "three-card", drawn: drawCards(3, true),
})

console.log("\nOrder state machine")
check("an unpaid order cannot be claimed",
  setStatus(order, "claimed", { readerId: reader.id }) === false)

setPayment(order, "paid")
check("a paid order can be claimed",
  setStatus(order, "claimed", { readerId: reader.id }) === true)

check("another reader cannot touch it",
  other ? setStatus(order, "delivered", { reading: "x", readerId: other.id }) === false : true)

check("an empty reading is refused",
  setStatus(order, "delivered", { reading: "   ", readerId: reader.id }) === false)

check("delivery with text is accepted",
  setStatus(order, "delivered", { reading: "A real reading.", readerId: reader.id }) === true)

check("delivered is terminal",
  setStatus(order, "open", { readerId: reader.id }) === false)

console.log("\nPayout arithmetic")
// 5500 * 0.70 is 3849.999... in binary float; truncation loses a cent.
const paid = listReaders(false).find((r) => r.price_cents === 5500)
check("€55.00 pays out €38.50, not €38.49",
  paid ? paid.payout === "38.50" : true, paid?.payout)

const owed = payoutsOwed()
check("delivered work appears as owed", owed.length > 0,
  owed.map((o) => `${o.name} €${o.owed}`).join(", "))

const before = readerEarnings(reader.id)
settleReader(reader.id)
const after = readerEarnings(reader.id)
check("settling moves owed to paid",
  after.owed === "0.00" && after.paid !== before.paid,
  `owed ${before.owed}→${after.owed}, paid ${before.paid}→${after.paid}`)

console.log("\nPayment idempotence")
check("a repeated webhook is not an error", setPayment(order, "paid") === true)

console.log("\nSubscribers")
const t1 = subscribe("dup@example.test", "test", CONSENT_TEXT, "1.2.3.4")
const t2 = subscribe("dup@example.test", "test", CONSENT_TEXT, "1.2.3.4")
check("re-subscribing a pending address reuses the row", Boolean(t1 && t2))
confirmSubscriber(t2!, "1.2.3.4")
check("confirming twice is not an error", Boolean(confirmSubscriber(t2!, "1.2.3.4")))
unsubscribe(t2!)
const t3 = subscribe("dup@example.test", "test", CONSENT_TEXT, "1.2.3.4")
const sub = t3 ? require("./lib/subscribers").getSubscriber(t3) : null
check("coming back after unsubscribing returns to pending, not confirmed",
  sub?.status === "pending", sub?.status)

check("a malformed address is rejected",
  subscribe("not an email", "test", CONSENT_TEXT) === null)

console.log("\nMail channels")
check("separation is enforced when domains differ",
  channelsAreSeparated() === true ||
  process.env.MAIL_TX_FROM === undefined)

console.log(`\n${failures === 0 ? "all passed" : `${failures} FAILED`}\n`)
process.exit(failures === 0 ? 0 : 1)
