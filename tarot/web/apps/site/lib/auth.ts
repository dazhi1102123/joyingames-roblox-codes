import "server-only"

import { cookies, headers } from "next/headers"
import { SESSION_COOKIE, accountForSession, type Account } from "./accounts"
import { readerByKey, type Reader } from "./readers"

/** Who is asking.
 *
 * Readers and the operator both authenticate with an unguessable key rather
 * than a password, for the same reason: a handful of hand-picked people, and a
 * password store would be a liability with no upside.
 */

export async function currentReader(): Promise<Reader | null> {
  const jar = await cookies()
  return readerByKey(jar.get("desk_key")?.value)
}

/** The signed-in visitor, if there is one. */
export async function currentAccount(): Promise<Account | null> {
  const jar = await cookies()
  return accountForSession(jar.get(SESSION_COOKIE)?.value)
}

/** Operators named by email, from the reference project's pattern.
 *
 * An allowlist beats a shared key on the two things that matter after the
 * first day: every action can record who took it, and revoking someone is an
 * edit to one variable rather than a new key for everybody else.
 *
 * Unset means nobody qualifies this way, which is the safe default -- the
 * alternative reading, "unset means everyone", is how an admin console ends up
 * open to the internet.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

async function hasAdminKey(): Promise<boolean> {
  const expected = process.env.ADMIN_KEY
  if (!expected) return false
  const jar = await cookies()
  const given = jar.get("admin_key")?.value
  if (!given || given.length !== expected.length) return false
  // Constant-time compare: a === would leak the key's bytes to a patient
  // attacker one character at a time.
  const crypto = await import("node:crypto")
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))
}

/** Either path in: the shared key, or an allowlisted account.
 *
 * The key stays because it needs no mail server and no account -- it is what
 * gets the console open on day one. The allowlist is what makes the audit log
 * worth having, since only it can name a person.
 */
export async function isOperator(): Promise<boolean> {
  if (await hasAdminKey()) return true
  const account = await currentAccount()
  return Boolean(account && adminEmails().includes(account.email))
}

/** Who to record against an operator action.
 *
 * The shared key cannot name anyone, and writing something that looks like a
 * name would be worse than admitting it: an audit line that says "admin key"
 * is honest about how much it knows.
 */
export async function operatorName(): Promise<string> {
  const account = await currentAccount()
  if (account && adminEmails().includes(account.email)) return account.email
  return (await hasAdminKey()) ? "admin key" : "unknown"
}

/** The visitor's address, for consent evidence.
 *
 * Trusts the proxy header, which is correct behind a CDN and wrong when
 * exposed directly -- so the deployment must terminate at one.
 */
export async function clientIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return h.get("x-real-ip") ?? ""
}
