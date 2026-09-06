import "server-only"

import { db, now } from "./db"

/** What the operator did, and when.
 *
 * The reference project keeps one of these and it is the single feature that
 * turns an admin console into something you can hand to a second person. Not
 * because anyone is suspected -- because "this order was marked paid and
 * nobody remembers why" is otherwise a question with no answer.
 *
 * Recording is deliberately not allowed to fail the action it records: an
 * operator who cannot mark an order paid because the log is unhappy is a worse
 * outcome than a missing line.
 */

export interface AuditEntry {
  id: number
  at: string
  actor: string
  action: string
  target: string
  note: string
}

export function record(actor: string, action: string, target = "", note = ""): void {
  try {
    db()
      .prepare(
        "INSERT INTO admin_audit (at, actor, action, target, note) VALUES (?,?,?,?,?)",
      )
      .run(now(), actor.slice(0, 200), action.slice(0, 64), target.slice(0, 200), note.slice(0, 500))
  } catch {
    // See above: the log is evidence, not a gate.
  }
}

export function recent(limit = 50): AuditEntry[] {
  return db()
    .prepare("SELECT * FROM admin_audit ORDER BY at DESC, id DESC LIMIT ?")
    .all(limit) as AuditEntry[]
}
