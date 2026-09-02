#!/usr/bin/env python3
"""Prepare a working copy: write .env, then seed example data.

Shared by dev.sh and 启动.bat so the two platforms cannot drift. Batch files are
a poor place for string manipulation and secret generation; this keeps that in
one tested place.

Idempotent throughout. An existing .env is never overwritten, and seeding is
skipped once there are orders — re-running is always safe.
"""

from __future__ import annotations

import pathlib
import secrets
import sys

HERE = pathlib.Path(__file__).resolve().parent


def write_env(port=5000):
    env = HERE / ".env"
    if env.exists():
        print("  = .env already exists, left alone")
        return False

    example = HERE / ".env.example"
    if not example.exists():
        print("  ! .env.example is missing")
        return False

    text = example.read_text(encoding="utf-8")
    replacements = {
        # Without these two the site still runs, but reader and operator
        # sessions reset on every restart.
        "SECRET_KEY=\n": f"SECRET_KEY={secrets.token_hex(32)}\n",
        "ADMIN_KEY=\n": f"ADMIN_KEY={secrets.token_urlsafe(24)}\n",
        "PUBLIC_SITE_URL=https://your-domain.example":
            f"PUBLIC_SITE_URL=http://localhost:{port}",
        # The container path would be wrong for a local run.
        "READINGS_DB=/data/readings.db": "READINGS_DB=./readings.db",
        # Two distinct domains, so the marketing channel is not blocked while
        # you look around. Both print to the terminal — nothing is sent.
        "MAIL_TX_FROM=Arcana Press <hello@your-domain.example>":
            "MAIL_TX_FROM=Arcana Press <hello@localhost.test>",
        "MAIL_MK_FROM=Arcana Press <daily@your-sending-domain.example>":
            "MAIL_MK_FROM=Arcana Press <daily@localhost-daily.test>",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    env.write_text(text, encoding="utf-8")
    print("  + .env written with generated secrets")
    return True


def seed():
    sys.path.insert(0, str(HERE))
    import seed_readers
    import seed_demo

    print("\nSeeding readers")
    seed_readers.main()
    print()
    seed_demo.main()


def admin_key():
    env = HERE / ".env"
    if not env.exists():
        return ""
    for line in env.read_text(encoding="utf-8").splitlines():
        if line.startswith("ADMIN_KEY="):
            return line.partition("=")[2].strip()
    return ""


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    print("Preparing configuration")
    write_env(port)
    seed()
    print(f"\n{'-' * 68}")
    print(f"  http://localhost:{port}")
    print()
    print("  /                      the site")
    print("  /reading/celtic-cross  draw ten cards")
    print("  /report                describe a situation, get a written report")
    print("  /readers               order a reading from a person")
    print("  /desk                  reader's queue      - key printed above")
    print(f"  /admin                 operator            - key: {admin_key()}")
    print("  /legal/privacy         red MISSING markers are the fields you owe")
    print()
    print("  Emails print in this window instead of sending. Ctrl-C to stop.")
    print("-" * 68)
    return 0


if __name__ == "__main__":
    sys.exit(main())
