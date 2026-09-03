import "server-only"

import { DEFAULT_PAYOUT_SHARE, db, euros, now, token } from "./db"

export interface Reader {
  id: number
  slug: string
  name: string
  tagline: string
  bio: string
  approach: string
  specialties: string[]
  price_cents: number
  payout_cents: number
  currency: string
  turnaround_h: number
  capacity: number
  active: number
  access_key: string
  created_at: string
  price: string
  payout: string
  margin: string
}

function shape(row: any): Reader {
  return {
    ...row,
    specialties: JSON.parse(row.specialties || "[]"),
    price: euros(row.price_cents),
    payout: euros(row.payout_cents ?? 0),
    margin: euros(row.price_cents - (row.payout_cents ?? 0)),
  }
}

export function addReader(input: {
  slug: string
  name: string
  tagline?: string
  bio?: string
  approach?: string
  specialties?: string[]
  price_cents?: number
  currency?: string
  turnaround_h?: number
  capacity?: number
  payout_cents?: number
}): Reader {
  const price = input.price_cents ?? 3500
  // Math.round, not truncation: 5500 * 0.70 is 3849.999... in binary floating
  // point, and flooring would quietly shortchange the reader by a cent.
  const payout = input.payout_cents ?? Math.round(price * DEFAULT_PAYOUT_SHARE)

  db()
    .prepare(
      `INSERT INTO readers
         (slug, name, tagline, bio, approach, specialties, price_cents,
          currency, turnaround_h, capacity, access_key, created_at, payout_cents)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      input.slug,
      input.name,
      input.tagline ?? "",
      input.bio ?? "",
      input.approach ?? "",
      JSON.stringify(input.specialties ?? []),
      price,
      input.currency ?? "EUR",
      input.turnaround_h ?? 48,
      input.capacity ?? 5,
      token(),
      now(),
      payout,
    )
  return getReader(input.slug)!
}

export function listReaders(activeOnly = true): Reader[] {
  const rows = db()
    .prepare(
      `SELECT * FROM readers ${activeOnly ? "WHERE active = 1" : ""} ORDER BY name`,
    )
    .all()
  return rows.map(shape)
}

export function getReader(slug: string): Reader | null {
  const row = db().prepare("SELECT * FROM readers WHERE slug = ?").get(slug)
  return row ? shape(row) : null
}

/** Readers sign in with an unguessable key, not a password.
 *
 * There are a handful of readers, hand-picked. A password store for that is a
 * liability with no upside -- the key is rotatable and carries no reuse risk
 * across other services.
 */
export function readerByKey(key: string | undefined | null): Reader | null {
  if (!key || key.length > 64) return null
  const row = db()
    .prepare("SELECT * FROM readers WHERE access_key = ? AND active = 1")
    .get(key)
  return row ? shape(row) : null
}

/** How many live orders a reader is holding, for the capacity check. */
export function readerLoad(readerId: number): number {
  const row = db()
    .prepare(
      `SELECT COUNT(*) AS n FROM orders
       WHERE reader_id = ? AND status IN ('open','claimed')
         AND payment_status IN ('pending','paid')`,
    )
    .get(readerId) as { n: number }
  return row.n
}
