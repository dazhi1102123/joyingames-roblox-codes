import "server-only"

import { cookies, headers } from "next/headers"
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

export async function isOperator(): Promise<boolean> {
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
