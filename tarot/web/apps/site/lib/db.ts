import "server-only"

import Database from "better-sqlite3"
import path from "node:path"
import fs from "node:fs"

/** SQLite, ported from tarot/store.py.
 *
 * Same schema, same state machine, same retention rule. Kept plain so moving
 * to Postgres later is a driver swap rather than a rewrite.
 */

const DB_PATH =
  process.env.READINGS_DB ?? path.join(process.cwd(), "readings.db")

export const RETENTION_DAYS = Number(process.env.ORDER_RETENTION_DAYS ?? "90")

/** What a reader keeps when no explicit payout is configured. */
export const DEFAULT_PAYOUT_SHARE = 0.7

const SCHEMA = `
CREATE TABLE IF NOT EXISTS readers (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    slug          TEXT    NOT NULL UNIQUE,
    name          TEXT    NOT NULL,
    tagline       TEXT    NOT NULL DEFAULT '',
    bio           TEXT    NOT NULL DEFAULT '',
    approach      TEXT    NOT NULL DEFAULT '',
    specialties   TEXT    NOT NULL DEFAULT '[]',
    price_cents   INTEGER NOT NULL DEFAULT 3500,
    currency      TEXT    NOT NULL DEFAULT 'EUR',
    turnaround_h  INTEGER NOT NULL DEFAULT 48,
    capacity      INTEGER NOT NULL DEFAULT 5,
    active        INTEGER NOT NULL DEFAULT 1,
    access_key    TEXT    NOT NULL UNIQUE,
    created_at    TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    token          TEXT    NOT NULL UNIQUE,
    reader_id      INTEGER NOT NULL REFERENCES readers(id) ON DELETE CASCADE,
    status         TEXT    NOT NULL DEFAULT 'open',
    focus          TEXT    NOT NULL DEFAULT 'general',
    situation      TEXT    NOT NULL DEFAULT '',
    tried          TEXT    NOT NULL DEFAULT '',
    birth_ymd      TEXT    NOT NULL DEFAULT '',
    spread_slug    TEXT    NOT NULL,
    drawn          TEXT    NOT NULL,
    price_cents    INTEGER NOT NULL,
    currency       TEXT    NOT NULL,
    reading        TEXT    NOT NULL DEFAULT '',
    payment_status TEXT    NOT NULL DEFAULT 'unpaid',
    payment_ref    TEXT    NOT NULL DEFAULT '',
    created_at     TEXT    NOT NULL,
    claimed_at     TEXT,
    delivered_at   TEXT,
    expires_at     TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS subscribers (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    NOT NULL UNIQUE,
    status        TEXT    NOT NULL DEFAULT 'pending',
    token         TEXT    NOT NULL UNIQUE,
    source        TEXT    NOT NULL DEFAULT '',
    -- The evidence, not the checkbox. Under German §7 UWG the burden of
    -- proving consent is on the sender, and "they ticked a box" is not proof
    -- unless you can show when, from where, and the exact words agreed to.
    consent_text  TEXT    NOT NULL DEFAULT '',
    consent_at    TEXT    NOT NULL,
    consent_ip    TEXT    NOT NULL DEFAULT '',
    confirmed_at  TEXT,
    confirmed_ip  TEXT    NOT NULL DEFAULT '',
    unsubscribed_at TEXT,
    last_sent_at  TEXT
);
`

/** Columns added after the first release. Applied additively on every start,
 *  so upgrading is just deploying. */
const MIGRATIONS: Array<[string, string, string]> = [
  ["orders", "payment_status", "TEXT NOT NULL DEFAULT 'unpaid'"],
  ["orders", "payment_ref", "TEXT NOT NULL DEFAULT ''"],
  // The provider settles to one payee, so what each reader is owed is tracked
  // here. Snapshotted per order: a later rate change must not rewrite what was
  // already earned.
  ["readers", "payout_cents", "INTEGER NOT NULL DEFAULT 0"],
  ["orders", "reader_fee_cents", "INTEGER NOT NULL DEFAULT 0"],
  ["orders", "payout_status", "TEXT NOT NULL DEFAULT 'owed'"],
  ["orders", "paid_out_at", "TEXT"],
]

/** Indexes run *after* migrations: an index on a column a migration adds
 *  cannot be created before that column exists, and an existing database would
 *  otherwise fail to open. This ordering was a real bug in the Python. */
const INDEXES = `
CREATE INDEX IF NOT EXISTS idx_orders_reader  ON orders(reader_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_expires ON orders(expires_at);
CREATE INDEX IF NOT EXISTS idx_orders_payref  ON orders(payment_ref);
CREATE INDEX IF NOT EXISTS idx_orders_payout  ON orders(payout_status, reader_id);
CREATE INDEX IF NOT EXISTS idx_subs_status    ON subscribers(status);
`

let handle: Database.Database | null = null

export function db(): Database.Database {
  if (handle) return handle

  fs.mkdirSync(path.dirname(path.resolve(DB_PATH)), { recursive: true })
  const conn = new Database(DB_PATH, { timeout: 10_000 })
  conn.pragma("journal_mode = WAL")
  conn.pragma("foreign_keys = ON")

  conn.exec(SCHEMA)

  for (const table of ["orders", "readers"]) {
    const have = new Set(
      (conn.pragma(`table_info(${table})`) as Array<{ name: string }>).map((r) => r.name),
    )
    for (const [tbl, col, ddl] of MIGRATIONS) {
      if (tbl === table && !have.has(col)) {
        conn.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl}`)
      }
    }
  }

  // Backfill payouts for readers created before the column existed.
  conn
    .prepare(
      "UPDATE readers SET payout_cents = CAST(ROUND(price_cents * ?) AS INTEGER) " +
        "WHERE payout_cents = 0",
    )
    .run(DEFAULT_PAYOUT_SHARE)

  conn.exec(INDEXES)
  handle = conn
  return conn
}

export function now(): string {
  // Seconds precision, matching the Python, so timestamps sort identically
  // across rows written by either build during a migration window.
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
}

export function token(bytes = 24): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return Buffer.from(buf).toString("base64url")
}

export function euros(cents: number): string {
  return (cents / 100).toFixed(2)
}
