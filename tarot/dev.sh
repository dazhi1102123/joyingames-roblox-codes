#!/usr/bin/env bash
# Run the site locally, from nothing, in one command.
#
#   ./dev.sh
#
# Creates a virtualenv, installs dependencies, writes a .env with generated
# secrets if one does not exist, seeds three example readers with a delivered
# order to look at, and starts the server.
#
# Safe to re-run: it never overwrites an existing .env and never re-seeds a
# database that already has readers in it.
#
# No API keys are needed. Payment runs in `manual` mode and email prints to this
# terminal, so every flow is walkable without an account anywhere.

set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-5000}"
PY="${PYTHON:-python3}"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }

# --- 1. virtualenv -----------------------------------------------------------
if [ ! -d .venv ]; then
  say "Creating .venv"
  "$PY" -m venv .venv
fi
./.venv/bin/pip install --quiet --upgrade pip >/dev/null 2>&1 || true
say "Installing dependencies"
./.venv/bin/pip install --quiet -r requirements.txt

# --- 2. configuration --------------------------------------------------------
# Local runs keep the database beside the code. In Docker it lives on a volume
# at /data instead, which is why seeding has to happen *inside* the container
# there — see the README.
if [ ! -f .env ]; then
  say "Writing .env with generated secrets"
  cp .env.example .env
  SECRET=$(./.venv/bin/python -c 'import secrets;print(secrets.token_hex(32))')
  ADMIN=$(./.venv/bin/python -c 'import secrets;print(secrets.token_urlsafe(24))')
  ./.venv/bin/python - "$SECRET" "$ADMIN" "$PORT" <<'PY'
import pathlib, sys
secret, admin, port = sys.argv[1:4]
p = pathlib.Path(".env"); s = p.read_text()
s = s.replace("SECRET_KEY=\n", f"SECRET_KEY={secret}\n")
s = s.replace("ADMIN_KEY=\n", f"ADMIN_KEY={admin}\n")
s = s.replace("PUBLIC_SITE_URL=https://your-domain.example",
              f"PUBLIC_SITE_URL=http://localhost:{port}")
# Local database beside the code, not the container path.
s = s.replace("READINGS_DB=/data/readings.db", "READINGS_DB=./readings.db")
# Two distinct domains so the marketing channel is not blocked while you look
# around. Both print to the terminal — nothing is actually sent.
s = s.replace("MAIL_TX_FROM=Arcana Press <hello@your-domain.example>",
              "MAIL_TX_FROM=Arcana Press <hello@localhost.test>")
s = s.replace("MAIL_MK_FROM=Arcana Press <daily@your-sending-domain.example>",
              "MAIL_MK_FROM=Arcana Press <daily@localhost-daily.test>")
p.write_text(s)
PY
else
  say "Keeping the .env you already have"
fi

# --- 3. example data ---------------------------------------------------------
say "Seeding readers"
# No sourcing of .env here: values contain spaces, and the app parses the
# file itself via envfile.py before anything reads the environment.
./.venv/bin/python seed_readers.py
./.venv/bin/python seed_demo.py

# --- 4. go -------------------------------------------------------------------
ADMIN_KEY_SHOWN=$(grep '^ADMIN_KEY=' .env | cut -d= -f2-)
cat <<EOF

────────────────────────────────────────────────────────────────────
  http://localhost:${PORT}

  /                      the site
  /reading/celtic-cross  draw ten cards
  /report                describe a situation, get a written report
  /readers               order a reading from a person
  /desk                  reader's queue      — key printed above
  /admin                 operator            — key: ${ADMIN_KEY_SHOWN}
  /legal/privacy         red MISSING markers are the fields you owe

  Emails print here instead of sending. Ctrl-C to stop.
────────────────────────────────────────────────────────────────────
EOF

exec ./.venv/bin/python -c "
from app import app
app.run(host='127.0.0.1', port=${PORT}, debug=True)
"
