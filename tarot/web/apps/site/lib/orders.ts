import "server-only"

import { RETENTION_DAYS, db, euros, now, token } from "./db"
import type { Reader } from "./readers"

export type OrderStatus = "open" | "claimed" | "delivered" | "cancelled"
export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded"

/** Every state an order can be in, and what may follow it. Anything not
 *  listed here is rejected rather than silently written. */
const TRANSITIONS: Record<OrderStatus, ReadonlySet<string>> = {
  open: new Set(["claimed", "cancelled"]),
  claimed: new Set(["delivered", "open", "cancelled"]),
  delivered: new Set(),
  cancelled: new Set(),
}

export interface Order {
  id: number
  token: string
  reader_id: number
  status: OrderStatus
  focus: string
  situation: string
  tried: string
  birth_ymd: string
  spread_slug: string
  drawn: Array<{ slug: string; reversed: boolean }>
  price_cents: number
  reader_fee_cents: number
  currency: string
  reading: string
  payment_status: PaymentStatus
  payment_ref: string
  payout_status: string
  created_at: string
  claimed_at: string | null
  delivered_at: string | null
  expires_at: string
  reader_name: string
  reader_slug: string
  reader_tagline: string
  turnaround_h: number
  price: string
  fee: string
  due_at: string
  overdue: boolean
}

const JOIN = `
  SELECT o.*, r.name AS reader_name, r.slug AS reader_slug,
         r.turnaround_h, r.tagline AS reader_tagline
  FROM orders o JOIN readers r ON r.id = o.reader_id
`

function shape(row: any): Order {
  const created = new Date(row.created_at)
  const due = new Date(created.getTime() + row.turnaround_h * 3600_000)
  return {
    ...row,
    drawn: JSON.parse(row.drawn),
    price: euros(row.price_cents),
    fee: euros(row.reader_fee_cents ?? 0),
    due_at: due.toISOString(),
    overdue:
      (row.status === "open" || row.status === "claimed") && Date.now() > due.getTime(),
  }
}

export function createOrder(
  reader: Reader,
  input: {
    focus: string
    situation: string
    tried: string
    birth_ymd: string
    spread_slug: string
    drawn: Array<{ slug: string; reversed: boolean }>
  },
): string {
  const tok = token()
  const expires = new Date(Date.now() + RETENTION_DAYS * 86_400_000)
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z")

  db()
    .prepare(
      `INSERT INTO orders
         (token, reader_id, status, focus, situation, tried, birth_ymd,
          spread_slug, drawn, price_cents, currency, created_at, expires_at,
          reader_fee_cents)
       VALUES (?,?,'open',?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      tok,
      reader.id,
      input.focus,
      input.situation,
      input.tried,
      input.birth_ymd,
      input.spread_slug,
      JSON.stringify(input.drawn),
      reader.price_cents,
      reader.currency,
      now(),
      expires,
      reader.payout_cents ?? 0,
    )
  return tok
}

export function getOrder(tok: string | undefined | null): Order | null {
  if (!tok || tok.length > 64) return null
  const row = db().prepare(`${JOIN} WHERE o.token = ?`).get(tok)
  return row ? shape(row) : null
}

/** A reader's queue.
 *
 * Unpaid orders are withheld by default. Nobody should spend an hour writing a
 * reading that was never paid for, and showing it in the queue as a temptation
 * is worse than not showing it.
 */
export function ordersForReader(
  readerId: number,
  statuses: OrderStatus[] = ["open", "claimed"],
  paidOnly = true,
): Order[] {
  const marks = statuses.map(() => "?").join(",")
  const pay = paidOnly ? " AND o.payment_status = 'paid'" : ""
  const rows = db()
    .prepare(
      `${JOIN} WHERE o.reader_id = ? AND o.status IN (${marks})${pay} ORDER BY o.created_at`,
    )
    .all(readerId, ...statuses)
  return rows.map(shape)
}

/** Record a payment outcome. Idempotent -- webhooks are delivered more than once. */
export function setPayment(
  tok: string,
  status: PaymentStatus,
  reference?: string,
): boolean {
  const row = db()
    .prepare("SELECT payment_status FROM orders WHERE token = ?")
    .get(tok) as { payment_status: string } | undefined
  if (!row) return false
  if (row.payment_status === status) return true

  if (reference === undefined) {
    db().prepare("UPDATE orders SET payment_status = ? WHERE token = ?").run(status, tok)
  } else {
    db()
      .prepare("UPDATE orders SET payment_status = ?, payment_ref = ? WHERE token = ?")
      .run(status, reference, tok)
  }
  return true
}

/** Resolve a provider's reference back to an order, for webhook handling. */
export function orderByPaymentRef(reference: string): Order | null {
  if (!reference || reference.length > 128) return null
  const row = db()
    .prepare(`${JOIN} WHERE o.payment_ref = ? OR o.token = ?`)
    .get(reference, reference)
  return row ? shape(row) : null
}

/** Everything awaiting settlement, for the operator's manual-payment view. */
export function unpaidOrders(limit = 100): Order[] {
  const rows = db()
    .prepare(
      `${JOIN} WHERE o.payment_status IN ('unpaid','pending') AND o.status != 'cancelled'
       ORDER BY o.created_at DESC LIMIT ?`,
    )
    .all(limit)
  return rows.map(shape)
}

/** Move an order along its state machine.
 *
 * Refuses transitions the machine does not allow, and refuses to touch an
 * order belonging to a different reader, so a stolen or guessed desk URL
 * cannot reach someone else's queue.
 */
export function setStatus(
  tok: string,
  next: OrderStatus,
  opts: { reading?: string; readerId?: number } = {},
): boolean {
  const row = db()
    .prepare("SELECT status, reader_id, payment_status FROM orders WHERE token = ?")
    .get(tok) as
    | { status: OrderStatus; reader_id: number; payment_status: string }
    | undefined
  if (!row) return false
  if (opts.readerId !== undefined && row.reader_id !== opts.readerId) return false
  if (!TRANSITIONS[row.status]?.has(next)) return false

  // Withholding unpaid work from the queue is not enough on its own -- the
  // token is guessable from a bookmark. Claiming is where a reader starts
  // spending time, so that is where payment is enforced. Delivery is
  // deliberately not gated: once someone has written the reading, a later
  // refund should not trap it.
  if (next === "claimed" && row.payment_status !== "paid") return false

  const fields = ["status = ?"]
  const values: unknown[] = [next]

  if (next === "claimed") {
    fields.push("claimed_at = ?")
    values.push(now())
  }
  if (next === "open") fields.push("claimed_at = NULL") // released back to the queue
  if (next === "delivered") {
    const text = (opts.reading ?? "").trim()
    if (!text) return false
    fields.push("delivered_at = ?", "reading = ?")
    values.push(now(), text)
  }

  values.push(tok)
  db().prepare(`UPDATE orders SET ${fields.join(", ")} WHERE token = ?`).run(...values)
  return true
}

// ---------------------------------------------------------------------------
// Retention
//
// Deletion runs off the request path rather than a cron job, because a
// retention policy that depends on someone remembering to run something is not
// a policy. The hourly guard keeps it off the hot path.
// ---------------------------------------------------------------------------

let lastPurge = 0
const PURGE_INTERVAL = 3_600_000

export function purgeExpired(force = false): number {
  if (!force && Date.now() - lastPurge < PURGE_INTERVAL) return 0
  lastPurge = Date.now()
  return db().prepare("DELETE FROM orders WHERE expires_at < ?").run(now()).changes
}
