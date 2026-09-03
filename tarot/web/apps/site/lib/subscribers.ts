import "server-only"

import { db, now, token } from "./db"

/** Double opt-in throughout. A pending row is not a subscriber and is never
 *  sent marketing -- only the one confirmation message that turns it into
 *  consent. */

export const SUB_PENDING = "pending"
export const SUB_CONFIRMED = "confirmed"
export const SUB_UNSUBSCRIBED = "unsubscribed"
export const SUB_COMPLAINED = "complained"

export const CONSENT_TEXT =
  "Send me the daily card by email. I can unsubscribe with one click in any message."

/** A deliberately permissive shape check. Real validation is the confirmation
 *  email: an address that cannot receive one never becomes a subscriber. */
export function normaliseEmail(raw: string | null | undefined): string | null {
  const email = (raw ?? "").trim().toLowerCase()
  if (email.length > 254) return null
  if ((email.match(/@/g) ?? []).length !== 1) return null
  const [local, domain] = email.split("@")
  if (!local || !domain.includes(".")) return null
  if (domain.startsWith(".") || domain.endsWith(".")) return null
  if (/\s/.test(email)) return null
  return email
}

/** Record an intent to subscribe and return its token, or null if invalid.
 *
 * Idempotent by address. Re-subscribing a pending row reuses it so a second
 * click does not create a duplicate; re-subscribing an unsubscribed address
 * reopens it as *pending*, never straight to confirmed -- leaving takes one
 * click, coming back means proving the mailbox again.
 */
export function subscribe(
  rawEmail: string,
  source: string,
  consentText: string,
  ip = "",
): string | null {
  const email = normaliseEmail(rawEmail)
  if (!email) return null

  const tok = token()
  const row = db()
    .prepare("SELECT id, status, token FROM subscribers WHERE email = ?")
    .get(email) as { id: number; status: string; token: string } | undefined

  if (row) {
    if (row.status === SUB_CONFIRMED) return row.token // already in
    db()
      .prepare(
        `UPDATE subscribers
         SET status = ?, token = ?, source = ?, consent_text = ?,
             consent_at = ?, consent_ip = ?, unsubscribed_at = NULL
         WHERE id = ?`,
      )
      .run(SUB_PENDING, tok, source, consentText, now(), ip, row.id)
    return tok
  }

  db()
    .prepare(
      `INSERT INTO subscribers
         (email, status, token, source, consent_text, consent_at, consent_ip)
       VALUES (?,?,?,?,?,?,?)`,
    )
    .run(email, SUB_PENDING, tok, source, consentText, now(), ip)
  return tok
}

export function getSubscriber(tok: string | null | undefined) {
  if (!tok || tok.length > 64) return null
  return (db().prepare("SELECT * FROM subscribers WHERE token = ?").get(tok) as any) ?? null
}

/** Complete double opt-in. */
export function confirmSubscriber(tok: string, ip = "") {
  const sub = getSubscriber(tok)
  if (!sub || sub.status === SUB_UNSUBSCRIBED) return null
  if (sub.status === SUB_CONFIRMED) return sub // a second click is not an error

  db()
    .prepare(
      "UPDATE subscribers SET status = ?, confirmed_at = ?, confirmed_ip = ? WHERE token = ?",
    )
    .run(SUB_CONFIRMED, now(), ip, tok)
  return getSubscriber(tok)
}

/** One click out. Always reports success -- an address that is not on the list
 *  is, from the sender's side, exactly as unsubscribed as one that was. */
export function unsubscribe(tok: string, complained = false): boolean {
  if (!tok || tok.length > 64) return false
  const status = complained ? SUB_COMPLAINED : SUB_UNSUBSCRIBED
  db()
    .prepare(
      "UPDATE subscribers SET status = ?, unsubscribed_at = ? WHERE token = ? AND status != ?",
    )
    .run(status, now(), tok, status)
  return true
}

/** A page of confirmed subscribers, for a send. Excludes everything else --
 *  pending, unsubscribed and complained addresses are never returned. */
export function confirmedSubscribers(limit = 500, afterId = 0) {
  return db()
    .prepare(
      "SELECT id, email, token FROM subscribers WHERE status = ? AND id > ? ORDER BY id LIMIT ?",
    )
    .all(SUB_CONFIRMED, afterId, limit) as Array<{
    id: number
    email: string
    token: string
  }>
}

export function markSent(ids: number[]) {
  if (!ids.length) return
  const stmt = db().prepare("UPDATE subscribers SET last_sent_at = ? WHERE id = ?")
  const stamp = now()
  db().transaction(() => ids.forEach((id) => stmt.run(stamp, id)))()
}

export function subscriberStats(): Record<string, number> {
  const rows = db()
    .prepare("SELECT status, COUNT(*) AS n FROM subscribers GROUP BY status")
    .all() as Array<{ status: string; n: number }>
  const stats: Record<string, number> = {}
  for (const r of rows) stats[r.status] = r.n
  stats.total = rows.reduce((sum, r) => sum + r.n, 0)
  return stats
}

/** Erasure, for a GDPR request. Deletes rather than flagging -- an erasure
 *  request is not satisfied by keeping the row with a marker on it. */
export function forgetSubscriber(rawEmail: string): boolean {
  const email = normaliseEmail(rawEmail)
  if (!email) return false
  return db().prepare("DELETE FROM subscribers WHERE email = ?").run(email).changes > 0
}
