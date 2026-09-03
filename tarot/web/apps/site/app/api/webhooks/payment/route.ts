import { NextResponse } from "next/server"
import { orderByPaymentRef, setPayment } from "@/lib/orders"
import { provider } from "@/lib/payments"

/** The provider's webhook.
 *
 * Reads the raw body before parsing, because the signature covers the exact
 * bytes sent -- re-serialising a parsed object changes them and every
 * verification fails.
 */
export async function POST(request: Request) {
  const body = await request.text()

  const verified = provider().verifyWebhook(body, request.headers)
  if (!verified) {
    // Deliberately terse. Telling an unverified caller why it failed helps
    // them get it right next time.
    return NextResponse.json({ error: "unverified" }, { status: 400 })
  }

  const order = orderByPaymentRef(verified.reference)
  if (!order) return NextResponse.json({ error: "unknown reference" }, { status: 404 })

  // setPayment is idempotent: providers deliver a webhook more than once and a
  // redelivery must not be an error.
  setPayment(order.token, verified.event === "paid" ? "paid" : "refunded")
  return NextResponse.json({ ok: true })
}
