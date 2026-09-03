import "server-only"

import { db, euros, now } from "./db"

/** The payout ledger.
 *
 * The provider settles to a single payee and does not split, so the money owed
 * to each reader is tracked here and paid out of band. That makes the site the
 * seller and readers subcontractors -- a studio, not a marketplace -- which is
 * a legal posture as much as a data model.
 */

export interface Owed {
  id: number
  slug: string
  name: string
  currency: string
  jobs: number
  owed_cents: number
  owed: string
}

export function payoutsOwed(): Owed[] {
  const rows = db()
    .prepare(
      `SELECT r.id, r.slug, r.name, r.currency,
              COUNT(*)                AS jobs,
              SUM(o.reader_fee_cents) AS owed_cents
       FROM orders o JOIN readers r ON r.id = o.reader_id
       WHERE o.status = 'delivered'
         AND o.payment_status = 'paid'
         AND o.payout_status = 'owed'
       GROUP BY r.id ORDER BY owed_cents DESC`,
    )
    .all() as any[]
  return rows.map((r) => ({ ...r, owed: euros(r.owed_cents ?? 0) }))
}

export function readerEarnings(readerId: number) {
  const row = db()
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN payout_status = 'owed' THEN reader_fee_cents END), 0) AS owed,
         COALESCE(SUM(CASE WHEN payout_status = 'paid' THEN reader_fee_cents END), 0) AS paid,
         COUNT(*) AS delivered
       FROM orders
       WHERE reader_id = ? AND status = 'delivered' AND payment_status = 'paid'`,
    )
    .get(readerId) as { owed: number; paid: number; delivered: number }
  return {
    owed: euros(row.owed),
    paid: euros(row.paid),
    delivered: row.delivered,
  }
}

/** Mark everything currently owed to one reader as paid out.
 *
 * Only touches rows that are delivered AND paid by the customer -- never
 * advances money against an order that has not settled.
 */
export function settleReader(readerId: number): { jobs: number; cents: number } {
  const row = db()
    .prepare(
      `SELECT COUNT(*) AS jobs, COALESCE(SUM(reader_fee_cents), 0) AS cents
       FROM orders WHERE reader_id = ? AND status = 'delivered'
         AND payment_status = 'paid' AND payout_status = 'owed'`,
    )
    .get(readerId) as { jobs: number; cents: number }
  if (!row.jobs) return { jobs: 0, cents: 0 }

  db()
    .prepare(
      `UPDATE orders SET payout_status = 'paid', paid_out_at = ?
       WHERE reader_id = ? AND status = 'delivered'
         AND payment_status = 'paid' AND payout_status = 'owed'`,
    )
    .run(now(), readerId)
  return row
}
