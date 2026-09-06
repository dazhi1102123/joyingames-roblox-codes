import "server-only"

import crypto from "node:crypto"

import { db, now, token } from "./db"

/** Visitor accounts, and the sessions that stand for them.
 *
 * Sign-in is a link in an email. No password -- not to be fashionable, but
 * because a password store is a liability with no upside here: there is
 * nothing behind an account that is worth more than the mailbox it is
 * addressed to, so a password would only add something to steal.
 *
 * Everything an account does is a convenience. Orders remain reachable by
 * their token whether or not anyone ever signs in, so losing this table loses
 * nobody their reading.
 */

export interface Account {
  id: number
  email: string
  status: "active" | "banned"
  created_at: string
  last_seen_at: string | null
  last_link_at: string | null
}

/** How long each kind of token lives.
 *
 * The link is short because it sits in a mailbox, which is a place other
 * people sometimes reach. The session is long because expiring it early just
 * teaches people to keep the link email forever.
 */
const LINK_TTL_MIN = 15
const SESSION_TTL_DAYS = 60

export const SESSION_COOKIE = "account"

/** Cookie flags, stated once because both a server action and a route handler
 *  need them and two copies would drift.
 *
 * Secure everywhere except an explicitly local host. Keying it on NODE_ENV
 * instead means a production build reached over plain HTTP sets a Secure
 * cookie the browser silently drops, and sign-in fails with no error visible
 * anywhere. Keying it on x-forwarded-proto would be worse: that header is
 * attacker-supplied unless a proxy overwrites it, so a request could downgrade
 * its own cookie.
 */
export function cookieOptions(host: string, maxAge: number) {
  const local = host.startsWith("localhost:") || host.startsWith("127.0.0.1:")
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: !local,
    path: "/",
    maxAge,
  }
}

/** Store the hash, compare the hash.
 *
 * The token is only ever in the cookie and the email. What the database holds
 * is a fingerprint of it, so a copy of readings.db is not a pile of live
 * sessions. SHA-256 unsalted is right here and would be wrong for a password:
 * the input is 192 bits of CSPRNG output, so there is no dictionary to run.
 */
function fingerprint(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex")
}

export function normaliseEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase()
  // Deliberately loose. The confirming link is the real check -- an address
  // that does not exist simply never gets used, and a stricter pattern mostly
  // rejects addresses that are in fact valid.
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email) || email.length > 254) return null
  return email
}

export function accountByEmail(email: string): Account | null {
  return (db().prepare("SELECT * FROM accounts WHERE email = ?").get(email) as Account) ?? null
}

export function accountById(id: number): Account | null {
  return (db().prepare("SELECT * FROM accounts WHERE id = ?").get(id) as Account) ?? null
}

/** Find or create. Signing in for the first time is the same act as signing up:
 *  asking someone to choose which one they are doing is a step with no answer
 *  behind it. */
export function upsertAccount(email: string): Account {
  const existing = accountByEmail(email)
  if (existing) return existing
  db()
    .prepare("INSERT INTO accounts (email, status, created_at) VALUES (?, 'active', ?)")
    .run(email, now())
  return accountByEmail(email)!
}

/** How often one address may ask for a link.
 *
 * Without this, the form is a button that sends mail to any address a stranger
 * types, as fast as they can type it -- which is a way to get the sending
 * domain blocked using nothing but our own server.
 */
const LINK_COOLDOWN_MS = 60_000

export function tooSoonForLink(email: string): boolean {
  // Read from the account, not the link row. Redeeming a link deletes that
  // row, so a cooldown kept there would reset every time a link was actually
  // used -- which is the one case where it looks like it is working.
  const account = accountByEmail(email)
  if (!account?.last_link_at) return false
  return Date.now() - new Date(account.last_link_at).getTime() < LINK_COOLDOWN_MS
}

/** Mint a one-time sign-in link token. Returns the raw token -- the only time
 *  it exists outside the email. */
export function issueLink(email: string): string {
  const account = upsertAccount(email)
  const raw = token(24)
  const expires = new Date(Date.now() + LINK_TTL_MIN * 60_000)
  db().prepare("UPDATE accounts SET last_link_at = ? WHERE id = ?").run(now(), account.id)
  db()
    .prepare(
      "INSERT INTO sessions (token_hash, account_id, purpose, created_at, expires_at) " +
        "VALUES (?,?,'link',?,?)",
    )
    .run(fingerprint(raw), account.id, now(), expires.toISOString().replace(/\.\d{3}Z$/, "Z"))
  return raw
}

/** Spend a link and mint a session. Returns the session token, or null.
 *
 * The link row is deleted whether or not it was still valid, so a link that
 * leaks after use is worth nothing and a replay cannot be distinguished from a
 * typo -- both just fail.
 */
export function redeemLink(raw: string): string | null {
  if (!raw || raw.length > 128) return null
  const hash = fingerprint(raw)
  const row = db()
    .prepare("SELECT * FROM sessions WHERE token_hash = ? AND purpose = 'link'")
    .get(hash) as { account_id: number; expires_at: string } | undefined
  db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hash)
  if (!row) return null
  if (new Date(row.expires_at).getTime() < Date.now()) return null

  const account = accountById(row.account_id)
  if (!account || account.status !== "active") return null

  const session = token(24)
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000)
  db()
    .prepare(
      "INSERT INTO sessions (token_hash, account_id, purpose, created_at, expires_at) " +
        "VALUES (?,?,'session',?,?)",
    )
    .run(
      fingerprint(session),
      account.id,
      now(),
      expires.toISOString().replace(/\.\d{3}Z$/, "Z"),
    )
  db().prepare("UPDATE accounts SET last_seen_at = ? WHERE id = ?").run(now(), account.id)
  return session
}

/** Resolve a session cookie to the account behind it.
 *
 * Re-checks `status` on every request rather than trusting the cookie: banning
 * an account has to take effect now, not at the end of a sixty-day session.
 */
export function accountForSession(raw: string | undefined | null): Account | null {
  if (!raw || raw.length > 128) return null
  const row = db()
    .prepare("SELECT * FROM sessions WHERE token_hash = ? AND purpose = 'session'")
    .get(fingerprint(raw)) as { account_id: number; expires_at: string } | undefined
  if (!row) return null
  if (new Date(row.expires_at).getTime() < Date.now()) return null
  const account = accountById(row.account_id)
  return account && account.status === "active" ? account : null
}

export function endSession(raw: string | undefined | null): void {
  if (!raw) return
  db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(fingerprint(raw))
}

/** Every session an account has, gone. What "sign out everywhere" means, and
 *  what banning has to do to take effect immediately. */
export function endAllSessions(accountId: number): void {
  db().prepare("DELETE FROM sessions WHERE account_id = ?").run(accountId)
}

export function setAccountStatus(accountId: number, status: "active" | "banned"): void {
  db().prepare("UPDATE accounts SET status = ? WHERE id = ?").run(status, accountId)
  if (status === "banned") endAllSessions(accountId)
}

export function listAccounts(limit = 200): Array<Account & { orders: number }> {
  return db()
    .prepare(
      "SELECT a.*, (SELECT COUNT(*) FROM orders o WHERE o.account_id = a.id) AS orders " +
        "FROM accounts a ORDER BY a.created_at DESC LIMIT ?",
    )
    .all(limit) as Array<Account & { orders: number }>
}

export function accountStats(): { total: number; active: number } {
  const row = db()
    .prepare(
      "SELECT COUNT(*) AS total, SUM(status = 'active') AS active FROM accounts",
    )
    .get() as { total: number; active: number | null }
  return { total: row.total ?? 0, active: row.active ?? 0 }
}

/** Sweep expired links and sessions.
 *
 * Off the request path in the same way order retention is: a cleanup that
 * depends on someone running something is not cleanup. Expired rows are
 * already refused above, so this is housekeeping, not enforcement.
 */
let lastSweep = 0
const SWEEP_INTERVAL = 3_600_000

export function sweepSessions(force = false): number {
  if (!force && Date.now() - lastSweep < SWEEP_INTERVAL) return 0
  lastSweep = Date.now()
  return db().prepare("DELETE FROM sessions WHERE expires_at < ?").run(now()).changes
}
