import { NextResponse } from "next/server"
import crypto from "node:crypto"

import { sendDaily } from "@/lib/daily"

/** The daily send, triggered by a scheduler.
 *
 * The same runner the CLI uses, so the two cannot drift into sending different
 * mail -- or into one of them forgetting a guard.
 *
 * Two things make this safe to expose:
 *
 *  1. It refuses without `CRON_SECRET`. Unset means the route is off, not
 *     open: the other reading is how a URL that mails 400,000 people ends up
 *     reachable by anyone who guesses the path.
 *  2. Triggering it twice in a day sends nothing the second time. The runner
 *     skips anyone already mailed since midnight UTC, so a scheduler that
 *     retries on timeout -- which is the normal behaviour of every one of them
 *     -- cannot double-send.
 *
 * It defaults to a dry run like everything else here. A scheduler must pass
 * `?send=1` to actually send, which means a misconfigured trigger reports what
 * it would have done instead of doing it.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not set, so this route is disabled" },
      { status: 503 },
    )
  }

  // Accept either shape: an Authorization header is what most schedulers send,
  // a query parameter is what the simplest ones can manage.
  const url = new URL(request.url)
  const header = request.headers.get("authorization") ?? ""
  const given = header.startsWith("Bearer ")
    ? header.slice(7)
    : (url.searchParams.get("key") ?? "")

  // Constant-time, and length-checked first because timingSafeEqual throws on
  // a length mismatch rather than returning false.
  const a = Buffer.from(given)
  const b = Buffer.from(secret)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 })
  }

  const result = await sendDaily({
    dry: url.searchParams.get("send") !== "1",
    limit: Number(url.searchParams.get("limit") ?? 0) || 0,
    // Schedulers usually cap a request at a minute or so, and pausing between
    // batches inside one is how that cap gets hit. The runner still pages, so
    // a run that is cut short resumes on the next trigger rather than
    // restarting.
    pause: 0,
  })

  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}

/** GET reports without sending, so a scheduler can be pointed at it while
 *  being set up and the worst it can do is tell you the card. */
export async function GET(request: Request) {
  const withoutSend = new URL(request.url)
  withoutSend.searchParams.delete("send")
  return POST(new Request(withoutSend, { method: "POST", headers: request.headers }))
}
