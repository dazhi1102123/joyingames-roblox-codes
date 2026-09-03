#!/usr/bin/env bash
# Run the Next.js build locally, from nothing, in one command.
#
#   ./dev.sh          production build, then serve
#   ./dev.sh --dev    next dev instead: no build wait, recompiles on edit
#
# Installs dependencies, writes an .env.local with a generated admin key if
# one does not exist, seeds example readers and orders, and starts the server.
#
# Safe to re-run: it never overwrites .env.local and never re-seeds a database
# that already has readers in it.
#
# Needs Node 20+. pnpm comes from corepack, which ships with Node.

set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-3000}"
MODE="${1:-}"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }

# --- 1. toolchain ------------------------------------------------------------
command -v node >/dev/null || { echo "Node 20+ is required: https://nodejs.org/"; exit 1; }
node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 20 ? 0 : 1)' \
  || { echo "Node 20 or newer is required, this is $(node -v)"; exit 1; }

PNPM=pnpm
if ! command -v pnpm >/dev/null; then
  # corepack reads "packageManager" in package.json and fetches the exact
  # version this project was built with, so only Node has to be installed.
  corepack enable pnpm >/dev/null 2>&1 || true
  command -v pnpm >/dev/null || PNPM="corepack pnpm"
fi

say "Installing dependencies"
$PNPM install --silent

# --- 2. configuration --------------------------------------------------------
ENV=apps/site/.env.local
if [ ! -f "$ENV" ]; then
  say "Writing $ENV with a generated admin key"
  cat > "$ENV" <<EOF
ADMIN_KEY=$(node -e 'console.log(require("crypto").randomBytes(18).toString("base64url"))')
MAIL_TX_FROM=Arcana Press <hello@arcana.test>
MAIL_MK_FROM=Arcana Press <daily@arcana-daily.test>
NEXT_PUBLIC_SITE_URL=http://localhost:${PORT}
EOF
else
  echo "  = $ENV already exists, left alone"
fi

# --- 3. example data ---------------------------------------------------------
say "Seeding example readers and orders"
$PNPM run seed

ADMIN_KEY=$(sed -n 's/^ADMIN_KEY=//p' "$ENV")

# --- 4. go -------------------------------------------------------------------
if [ "$MODE" = "--dev" ]; then
  say "Starting the dev server"
else
  say "Building (over 1,200 pages, about a minute)"
  $PNPM run build
fi

cat <<EOF

--------------------------------------------------------------------
  http://localhost:${PORT}/preview     every page, in one list

  /admin  key: ${ADMIN_KEY}
  /desk   keys were printed by the seed step, above

  Emails print in this window instead of being sent. Ctrl-C to stop.
--------------------------------------------------------------------

EOF

if [ "$MODE" = "--dev" ]; then
  exec $PNPM --filter @arcana/site exec next dev -p "$PORT"
fi
# Opens the browser once the port answers, not before.
node open-when-ready.mjs "$PORT" /preview &

exec $PNPM --filter @arcana/site exec next start -p "$PORT"
