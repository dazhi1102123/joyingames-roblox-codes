/** Send the daily card.
 *
 *     pnpm daily                    # dry run: renders, sends nothing
 *     pnpm daily -- --send
 *     pnpm daily -- --send --limit 50
 *
 * Dry run is the default on purpose, and it is the same default the shared
 * runner has. A campaign script whose no-argument behaviour is "mail everyone"
 * is one shell-history arrow-up away from a mistake that cannot be undone.
 */

import { sendDaily } from "./lib/daily"

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

function value(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return fallback
  const n = Number(process.argv[i + 1])
  return Number.isFinite(n) ? n : fallback
}

// Wrapped rather than top-level await: this runs under tsx's CJS transform,
// where a top-level await is a hard error at load. The same shape as verify.ts.
async function main() {
  const result = await sendDaily({
    dry: !flag("send"),
    limit: value("limit", 0),
    batch: value("batch", 100),
    pause: value("pause", 1),
    log: (line) => console.log(line),
  })

  if (result.dry) console.log("\nAdd --send to send for real.")
  process.exit(result.ok ? 0 : 1)
}

main()
