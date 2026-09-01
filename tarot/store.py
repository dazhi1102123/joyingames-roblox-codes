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
    created_at    TEXT    NOT NULL,
    claimed_at    TEXT,
    delivered_at  TEXT,
    expires_at    TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_reader  ON orders(reader_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_expires ON orders(expires_at);
"""

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


# ---------------------------------------------------------------------------
# Readers
# ---------------------------------------------------------------------------

def add_reader(slug, name, tagline="", bio="", approach="", specialties=None,
               price_cents=3500, currency="EUR", turnaround_h=48, capacity=5):
    with connect() as c:
        c.execute(
            """INSERT INTO readers
               (slug, name, tagline, bio, approach, specialties, price_cents,
                currency, turnaround_h, capacity, access_key, created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (slug, name, tagline, bio, approach, json.dumps(specialties or []),
             price_cents, currency, turnaround_h, capacity,
             secrets.token_urlsafe(24), _now()),
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
    return d


def reader_load(reader_id):
    """How many live orders a reader is holding, for the capacity check."""
    with connect() as c:
        return c.execute(
            "SELECT COUNT(*) FROM orders WHERE reader_id = ? AND status IN ('open','claimed')",
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
                spread_slug, drawn, price_cents, currency, created_at, expires_at)
               VALUES (?,?,'open',?,?,?,?,?,?,?,?,?,?)""",
            (token, reader["id"], focus, situation, tried, birth_ymd, spread_slug,
             json.dumps(drawn), reader["price_cents"], reader["currency"],
             _now(), expires),
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


def orders_for_reader(reader_id, statuses=("open", "claimed")):
    marks = ",".join("?" * len(statuses))
    with connect() as c:
        rows = c.execute(
            f"""SELECT o.*, r.name AS reader_name, r.slug AS reader_slug,
                       r.turnaround_h, r.tagline AS reader_tagline
                FROM orders o JOIN readers r ON r.id = o.reader_id
                WHERE o.reader_id = ? AND o.status IN ({marks})
                ORDER BY o.created_at""",
            (reader_id, *statuses)).fetchall()
        return [_order(r) for r in rows]


def _order(row):
    d = dict(row)
    d["drawn"] = json.loads(d["drawn"])
    d["price"] = f"{d['price_cents'] / 100:.2f}"
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
        row = c.execute("SELECT status, reader_id FROM orders WHERE token = ?",
                        (token,)).fetchone()
        if not row:
            return False
        if reader_id is not None and row["reader_id"] != reader_id:
            return False
        if new_status not in TRANSITIONS.get(row["status"], set()):
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
