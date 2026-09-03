import { CARDS } from "@arcana/core"

/** Liveness for a load balancer.
 *
 * Asserts the corpus actually loaded rather than just that the process is
 * listening -- a server serving 0 cards is up and useless, and that is the
 * failure a health check exists to catch.
 */
export const dynamic = "force-dynamic"

export function GET() {
  const ok = CARDS.length === 78
  return Response.json(
    { status: ok ? "ok" : "degraded", cards: CARDS.length },
    { status: ok ? 200 : 503 },
  )
}
