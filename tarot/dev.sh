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

# --- 2. configuration and example data ---------------------------------------
# Shared with the Windows launcher, so the two cannot drift. Writes .env with
# generated secrets if absent, then seeds; both steps are idempotent.
./.venv/bin/python bootstrap.py "$PORT"

# --- 3. go -------------------------------------------------------------------
# serve.py opens the browser once the port answers, not before.
exec ./.venv/bin/python serve.py "$PORT"
