"""Persistence for human readings.

This is the first feature in the project that genuinely needs a database, and
the first that stores something personal — a stranger's account of their own
situation. Two consequences run through this module:

  * **Store the minimum.** No account, no password, no email. A request is
    reached by an unguessable link, which is also the delivery mechanism. There
    is nothing here to leak that the visitor did not choose to type.
  * **Forget on a schedule.** Every order carries an expiry and is deleted, not
    archived, once it passes. Retention that depends on someone remembering to
    run a script is not retention policy.

SQLite because it needs no operations and this workload is a queue with a few
readers on it. Queries are written plainly so moving to MySQL later is a driver
swap rather than a rewrite.
"""

from __future__ import annotations

import json
import os
import secrets
import sqlite3
import time
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

DB_PATH = Path(os.environ.get("READINGS_DB", Path(__file__).with_name("readings.db")))
RETENTION_DAYS = int(os.environ.get("ORDER_RETENTION_DAYS", "90"))

SCHEMA = """
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
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    token         TEXT    NOT NULL UNIQUE,
    reader_id     INTEGER NOT NULL REFERENCES readers(id) ON DELETE CASCADE,
    status        TEXT    NOT NULL DEFAULT 'open',
    focus         TEXT    NOT NULL DEFAULT 'general',
    situation     TEXT    NOT NULL DEFAULT '',
    tried         TEXT    NOT NULL DEFAULT '',
    birth_ymd     TEXT    NOT NULL DEFAULT '',
    spread_slug   TEXT    NOT NULL,
    drawn         TEXT    NOT NULL,
    price_cents   INTEGER NOT NULL,
    currency      TEXT    NOT NULL,
    reading       TEXT    NOT NULL DEFAULT '',
    payment_status TEXT   NOT NULL DEFAULT 'unpaid',
    payment_ref   TEXT    NOT NULL DEFAULT '',
    created_at    TEXT    NOT NULL,
    claimed_at    TEXT,
    delivered_at  TEXT,
    expires_at    TEXT    NOT NULL
);

"""

# Indexes are applied *after* migrations: an index on a column added by a
# migration cannot be created before that column exists, and an existing
# database would otherwise fail to open.
INDEXES = """
CREATE TABLE IF NOT EXISTS subscribers (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    NOT NULL UNIQUE,
    status        TEXT    NOT NULL DEFAULT 'pending',
    token         TEXT    NOT NULL UNIQUE,
    source        TEXT    NOT NULL DEFAULT '',
    -- The evidence, not the checkbox. Under German §7 UWG the burden of proving
    -- consent is on the sender, and "they ticked a box" is not proof unless you
    -- can show when, from where, and the exact words they agreed to.
    consent_text  TEXT    NOT NULL DEFAULT '',
    consent_at    TEXT    NOT NULL,
    consent_ip    TEXT    NOT NULL DEFAULT '',
    confirmed_at  TEXT,
    confirmed_ip  TEXT    NOT NULL DEFAULT '',
    unsubscribed_at TEXT,
    last_sent_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_reader  ON orders(reader_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_expires ON orders(expires_at);
CREATE INDEX IF NOT EXISTS idx_orders_payref  ON orders(payment_ref);
CREATE INDEX IF NOT EXISTS idx_orders_payout  ON orders(payout_status, reader_id);
CREATE INDEX IF NOT EXISTS idx_subs_status    ON subscribers(status);
"""

# Columns added after the first release, as (table, column, ddl). Applied
# additively on every start, so upgrading is just deploying.
MIGRATIONS = (
    ("orders", "payment_status", "TEXT NOT NULL DEFAULT 'unpaid'"),
    ("orders", "payment_ref", "TEXT NOT NULL DEFAULT ''"),
    # The provider settles to one payee, so what each reader is owed has to be
    # tracked here. Snapshotted per order: a later rate change must not rewrite
    # what was already earned.
    ("readers", "payout_cents", "INTEGER NOT NULL DEFAULT 0"),
    ("orders", "reader_fee_cents", "INTEGER NOT NULL DEFAULT 0"),
    ("orders", "payout_status", "TEXT NOT NULL DEFAULT 'owed'"),
    ("orders", "paid_out_at", "TEXT"),
)

# What a reader keeps when no explicit payout is configured.
DEFAULT_PAYOUT_SHARE = 0.70

# Every state an order can be in, and what may follow it. Anything not listed
# here is rejected rather than silently written.
TRANSITIONS = {
    "open":      {"claimed", "cancelled"},
    "claimed":   {"delivered", "open", "cancelled"},
    "delivered": set(),
    "cancelled": set(),
}


def _now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@contextmanager
def connect():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connect() as c:
        c.executescript(SCHEMA)
        # SQLite has no ADD COLUMN IF NOT EXISTS, so check each table first.
        for table in ("orders", "readers"):
            have = {r["name"] for r in c.execute(f"PRAGMA table_info({table})")}
            for tbl, col, ddl in MIGRATIONS:
                if tbl == table and col not in have:
                    c.execute(f"ALTER TABLE {table} ADD COLUMN {col} {ddl}")
        # Backfill payouts for readers created before the column existed.
        c.execute(
            "UPDATE readers SET payout_cents = CAST(ROUND(price_cents * ?) AS INTEGER) "
            "WHERE payout_cents = 0", (DEFAULT_PAYOUT_SHARE,))
        c.executescript(INDEXES)


# ---------------------------------------------------------------------------
# Readers
# ---------------------------------------------------------------------------

def add_reader(slug, name, tagline="", bio="", approach="", specialties=None,
               price_cents=3500, currency="EUR", turnaround_h=48, capacity=5,
               payout_cents=None):
    if payout_cents is None:
        # round, not truncate: 5500 * 0.70 is 3849.999... in binary float,
        # and int() would quietly shortchange the reader by a cent.
        payout_cents = round(price_cents * DEFAULT_PAYOUT_SHARE)
    with connect() as c:
        c.execute(
            """INSERT INTO readers
               (slug, name, tagline, bio, approach, specialties, price_cents,
                currency, turnaround_h, capacity, access_key, created_at,
                payout_cents)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (slug, name, tagline, bio, approach, json.dumps(specialties or []),
             price_cents, currency, turnaround_h, capacity,
             secrets.token_urlsafe(24), _now(), payout_cents),
        )
        return c.execute("SELECT * FROM readers WHERE slug = ?", (slug,)).fetchone()


def list_readers(active_only=True):
    q = "SELECT * FROM readers"
    if active_only:
        q += " WHERE active = 1"
    q += " ORDER BY name"
    with connect() as c:
        return [_reader(r) for r in c.execute(q).fetchall()]


def get_reader(slug):
    with connect() as c:
        row = c.execute("SELECT * FROM readers WHERE slug = ?", (slug,)).fetchone()
        return _reader(row) if row else None


def reader_by_key(key):
    """Readers sign in with an unguessable key, not a password.

    There are a handful of readers, hand-picked. A password store for that is
    a liability with no upside — the key is rotatable and carries no reuse risk
    across other services.
    """
    if not key or len(key) > 64:
        return None
    with connect() as c:
        row = c.execute("SELECT * FROM readers WHERE access_key = ? AND active = 1",
                        (key,)).fetchone()
        return _reader(row) if row else None


def _reader(row):
    d = dict(row)
    d["specialties"] = json.loads(d["specialties"] or "[]")
    d["price"] = f"{d['price_cents'] / 100:.2f}"
    d["payout"] = f"{d.get('payout_cents', 0) / 100:.2f}"
    d["margin"] = f"{(d['price_cents'] - d.get('payout_cents', 0)) / 100:.2f}"
    return d


def reader_load(reader_id):
    """How many live orders a reader is holding, for the capacity check."""
    with connect() as c:
        return c.execute(
            """SELECT COUNT(*) FROM orders
               WHERE reader_id = ? AND status IN ('open','claimed')
                 AND payment_status IN ('pending','paid')""",
            (reader_id,),
        ).fetchone()[0]


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

def create_order(reader, focus, situation, tried, birth_ymd, spread_slug, drawn):
    token = secrets.token_urlsafe(24)
    expires = (datetime.now(timezone.utc) + timedelta(days=RETENTION_DAYS)).isoformat(timespec="seconds")
    with connect() as c:
        c.execute(
            """INSERT INTO orders
               (token, reader_id, status, focus, situation, tried, birth_ymd,
                spread_slug, drawn, price_cents, currency, created_at, expires_at,
                reader_fee_cents)
               VALUES (?,?,'open',?,?,?,?,?,?,?,?,?,?,?)""",
            (token, reader["id"], focus, situation, tried, birth_ymd, spread_slug,
             json.dumps(drawn), reader["price_cents"], reader["currency"],
             _now(), expires, reader.get("payout_cents", 0)),
        )
    return token


def get_order(token):
    if not token or len(token) > 64:
        return None
    with connect() as c:
        row = c.execute(
            """SELECT o.*, r.name AS reader_name, r.slug AS reader_slug,
                      r.turnaround_h, r.tagline AS reader_tagline
               FROM orders o JOIN readers r ON r.id = o.reader_id
               WHERE o.token = ?""", (token,)).fetchone()
        return _order(row) if row else None


def orders_for_reader(reader_id, statuses=("open", "claimed"), paid_only=True):
    """A reader's queue.

    Unpaid orders are withheld by default. Nobody should spend an hour writing
    a reading that was never paid for, and showing it in the queue as a
    temptation is worse than not showing it.
    """
    marks = ",".join("?" * len(statuses))
    pay_clause = " AND o.payment_status = 'paid'" if paid_only else ""
    with connect() as c:
        rows = c.execute(
            f"""SELECT o.*, r.name AS reader_name, r.slug AS reader_slug,
                       r.turnaround_h, r.tagline AS reader_tagline
                FROM orders o JOIN readers r ON r.id = o.reader_id
                WHERE o.reader_id = ? AND o.status IN ({marks}){pay_clause}
                ORDER BY o.created_at""",
            (reader_id, *statuses)).fetchall()
        return [_order(r) for r in rows]


def set_payment(token, status, reference=None):
    """Record a payment outcome. Idempotent — webhooks are delivered more than once."""
    with connect() as c:
        row = c.execute("SELECT payment_status FROM orders WHERE token = ?",
                        (token,)).fetchone()
        if not row:
            return False
        if row["payment_status"] == status:
            return True
        if reference is None:
            c.execute("UPDATE orders SET payment_status = ? WHERE token = ?",
                      (status, token))
        else:
            c.execute("UPDATE orders SET payment_status = ?, payment_ref = ? WHERE token = ?",
                      (status, reference, token))
        return True


def order_by_payment_ref(reference):
    """Resolve a provider's reference back to an order, for webhook handling."""
    if not reference or len(reference) > 128:
        return None
    with connect() as c:
        row = c.execute(
            """SELECT o.*, r.name AS reader_name, r.slug AS reader_slug,
                      r.turnaround_h, r.tagline AS reader_tagline
               FROM orders o JOIN readers r ON r.id = o.reader_id
               WHERE o.payment_ref = ? OR o.token = ?""",
            (reference, reference)).fetchone()
        return _order(row) if row else None


def unpaid_orders(limit=100):
    """Everything awaiting settlement, for the operator's manual-payment view."""
    with connect() as c:
        rows = c.execute(
            """SELECT o.*, r.name AS reader_name, r.slug AS reader_slug,
                      r.turnaround_h, r.tagline AS reader_tagline
               FROM orders o JOIN readers r ON r.id = o.reader_id
               WHERE o.payment_status IN ('unpaid', 'pending')
                 AND o.status != 'cancelled'
               ORDER BY o.created_at DESC LIMIT ?""", (limit,)).fetchall()
        return [_order(r) for r in rows]


def _order(row):
    d = dict(row)
    d["drawn"] = json.loads(d["drawn"])
    d["price"] = f"{d['price_cents'] / 100:.2f}"
    d["fee"] = f"{d.get('reader_fee_cents', 0) / 100:.2f}"
    created = datetime.fromisoformat(d["created_at"])
    d["due_at"] = created + timedelta(hours=d["turnaround_h"])
    d["overdue"] = (d["status"] in ("open", "claimed")
                    and datetime.now(timezone.utc) > d["due_at"])
    return d


def set_status(token, new_status, reading=None, reader_id=None):
    """Move an order along its state machine.

    Returns True on success. Refuses transitions the machine does not allow and
    refuses to touch an order belonging to a different reader, so a stolen or
    guessed desk URL cannot reach someone else's queue.
    """
    with connect() as c:
        row = c.execute(
            "SELECT status, reader_id, payment_status FROM orders WHERE token = ?",
            (token,)).fetchone()
        if not row:
            return False
        if reader_id is not None and row["reader_id"] != reader_id:
            return False
        if new_status not in TRANSITIONS.get(row["status"], set()):
            return False
        # Withholding unpaid work from the queue is not enough on its own —
        # the token is guessable from a bookmark. Claiming is where a reader
        # starts spending time, so that is where payment is enforced.
        # Delivery is deliberately not gated: once someone has written the
        # reading, a later refund should not trap it.
        if new_status == "claimed" and row["payment_status"] != "paid":
            return False

        fields, values = ["status = ?"], [new_status]
        if new_status == "claimed":
            fields.append("claimed_at = ?")
            values.append(_now())
        if new_status == "open":  # released back to the queue
            fields.append("claimed_at = NULL")
        if new_status == "delivered":
            if not (reading or "").strip():
                return False
            fields += ["delivered_at = ?", "reading = ?"]
            values += [_now(), reading.strip()]

        values.append(token)
        c.execute(f"UPDATE orders SET {', '.join(fields)} WHERE token = ?", values)
        return True


# ---------------------------------------------------------------------------
# Retention
#
# Deletion is wired into the request path rather than a cron job, because a
# retention policy that depends on someone remembering to run something is not
# a policy. The hourly guard keeps it off the hot path.
# ---------------------------------------------------------------------------

_last_purge = 0.0
PURGE_INTERVAL = 3600


def purge_expired(force=False):
    global _last_purge
    now = time.monotonic()
    if not force and now - _last_purge < PURGE_INTERVAL:
        return 0
    _last_purge = now
    with connect() as c:
        cur = c.execute("DELETE FROM orders WHERE expires_at < ?", (_now(),))
        return cur.rowcount


# ---------------------------------------------------------------------------
# Payout ledger
#
# The provider settles to a single payee and does not split, so the money owed
# to each reader is tracked here and paid out of band. That makes the site the
# seller and readers subcontractors — a studio, not a marketplace — which is a
# legal posture as much as a data model.
# ---------------------------------------------------------------------------

def payouts_owed():
    """Delivered readings not yet paid out, grouped by reader."""
    with connect() as c:
        rows = c.execute(
            """SELECT r.id, r.slug, r.name, r.currency,
                      COUNT(*)                AS jobs,
                      SUM(o.reader_fee_cents) AS owed_cents
               FROM orders o JOIN readers r ON r.id = o.reader_id
               WHERE o.status = 'delivered'
                 AND o.payment_status = 'paid'
                 AND o.payout_status = 'owed'
               GROUP BY r.id ORDER BY owed_cents DESC""").fetchall()
        out = []
        for row in rows:
            d = dict(row)
            d["owed"] = f"{(d['owed_cents'] or 0) / 100:.2f}"
            out.append(d)
        return out


def reader_earnings(reader_id):
    """What one reader has earned, split by whether it has been paid out."""
    with connect() as c:
        row = c.execute(
            """SELECT
                 COALESCE(SUM(CASE WHEN payout_status = 'owed'
                                   THEN reader_fee_cents END), 0) AS owed,
                 COALESCE(SUM(CASE WHEN payout_status = 'paid'
                                   THEN reader_fee_cents END), 0) AS paid,
                 COUNT(*) AS delivered
               FROM orders
               WHERE reader_id = ? AND status = 'delivered'
                 AND payment_status = 'paid'""", (reader_id,)).fetchone()
        return {
            "owed": f"{row['owed'] / 100:.2f}",
            "paid": f"{row['paid'] / 100:.2f}",
            "delivered": row["delivered"],
        }


def settle_reader(reader_id):
    """Mark everything currently owed to one reader as paid out.

    Returns (jobs, cents). Only touches rows that are delivered AND paid by the
    customer — never advances money against an order that has not settled.
    """
    with connect() as c:
        row = c.execute(
            """SELECT COUNT(*) AS jobs, COALESCE(SUM(reader_fee_cents), 0) AS cents
               FROM orders WHERE reader_id = ? AND status = 'delivered'
                 AND payment_status = 'paid' AND payout_status = 'owed'""",
            (reader_id,)).fetchone()
        if not row["jobs"]:
            return 0, 0
        c.execute(
            """UPDATE orders SET payout_status = 'paid', paid_out_at = ?
               WHERE reader_id = ? AND status = 'delivered'
                 AND payment_status = 'paid' AND payout_status = 'owed'""",
            (_now(), reader_id))
        return row["jobs"], row["cents"]


# ---------------------------------------------------------------------------
# Subscribers
#
# Double opt-in throughout. A pending row is not a subscriber and is never sent
# marketing — only the one confirmation message that turns it into consent.
# ---------------------------------------------------------------------------

SUB_PENDING = "pending"
SUB_CONFIRMED = "confirmed"
SUB_UNSUBSCRIBED = "unsubscribed"
SUB_COMPLAINED = "complained"

# A deliberately permissive shape check. Real validation is the confirmation
# email: an address that cannot receive one never becomes a subscriber.
def normalise_email(raw):
    email = (raw or "").strip().lower()
    if len(email) > 254 or email.count("@") != 1:
        return None
    local, _, domain = email.partition("@")
    if not local or "." not in domain or domain.startswith(".") or domain.endswith("."):
        return None
    if any(ch.isspace() for ch in email):
        return None
    return email


def subscribe(email, source, consent_text, ip=""):
    """Record an intent to subscribe and return its token, or None if invalid.

    Idempotent by address. Re-subscribing a pending row reuses it so a second
    click does not create a duplicate; re-subscribing an unsubscribed address
    reopens it as *pending*, never straight to confirmed — leaving requires one
    click, coming back requires proving the mailbox again.
    """
    email = normalise_email(email)
    if not email:
        return None
    token = secrets.token_urlsafe(24)
    with connect() as c:
        row = c.execute("SELECT id, status, token FROM subscribers WHERE email = ?",
                        (email,)).fetchone()
        if row:
            if row["status"] == SUB_CONFIRMED:
                return row["token"]        # already in; nothing to confirm
            c.execute(
                """UPDATE subscribers
                   SET status = ?, token = ?, source = ?, consent_text = ?,
                       consent_at = ?, consent_ip = ?, unsubscribed_at = NULL
                   WHERE id = ?""",
                (SUB_PENDING, token, source, consent_text, _now(), ip, row["id"]))
            return token
        c.execute(
            """INSERT INTO subscribers
               (email, status, token, source, consent_text, consent_at, consent_ip)
               VALUES (?,?,?,?,?,?,?)""",
            (email, SUB_PENDING, token, source, consent_text, _now(), ip))
        return token


def get_subscriber(token):
    if not token or len(token) > 64:
        return None
    with connect() as c:
        row = c.execute("SELECT * FROM subscribers WHERE token = ?", (token,)).fetchone()
        return dict(row) if row else None


def confirm_subscriber(token, ip=""):
    """Complete double opt-in. Returns the subscriber, or None."""
    sub = get_subscriber(token)
    if not sub or sub["status"] == SUB_UNSUBSCRIBED:
        return None
    if sub["status"] == SUB_CONFIRMED:
        return sub                          # a second click is not an error
    with connect() as c:
        c.execute(
            """UPDATE subscribers SET status = ?, confirmed_at = ?, confirmed_ip = ?
               WHERE token = ?""", (SUB_CONFIRMED, _now(), ip, token))
    return get_subscriber(token)


def unsubscribe(token, complained=False):
    """One click out. Always reports success — an address that is not on the
    list is, from the sender's side, exactly as unsubscribed as one that was."""
    if not token or len(token) > 64:
        return False
    status = SUB_COMPLAINED if complained else SUB_UNSUBSCRIBED
    with connect() as c:
        c.execute(
            """UPDATE subscribers SET status = ?, unsubscribed_at = ?
               WHERE token = ? AND status != ?""", (status, _now(), token, status))
    return True


def confirmed_subscribers(limit=500, after_id=0):
    """A page of confirmed subscribers, for a send. Excludes everything else —
    pending, unsubscribed and complained addresses are never returned."""
    with connect() as c:
        rows = c.execute(
            """SELECT id, email, token FROM subscribers
               WHERE status = ? AND id > ? ORDER BY id LIMIT ?""",
            (SUB_CONFIRMED, after_id, limit)).fetchall()
        return [dict(r) for r in rows]


def mark_sent(ids):
    if not ids:
        return
    with connect() as c:
        c.executemany("UPDATE subscribers SET last_sent_at = ? WHERE id = ?",
                      [(_now(), i) for i in ids])


def subscriber_stats():
    with connect() as c:
        rows = c.execute(
            "SELECT status, COUNT(*) AS n FROM subscribers GROUP BY status").fetchall()
        stats = {r["status"]: r["n"] for r in rows}
        stats["total"] = sum(stats.values())
        return stats


def forget_subscriber(email):
    """Erasure, for a GDPR request. Deletes rather than flagging — an erasure
    request is not satisfied by keeping the row with a marker on it."""
    email = normalise_email(email)
    if not email:
        return False
    with connect() as c:
        return c.execute("DELETE FROM subscribers WHERE email = ?", (email,)).rowcount > 0
