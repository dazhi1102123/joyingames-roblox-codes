import "server-only"

import { briefFor, cardOfTheDay } from "@arcana/core"

import { channelsAreSeparated, sendMarketing } from "./mailer"
import { confirmedSubscribers, markSent, subscriberStats } from "./subscribers"
import { dailyEmail } from "./emails"
import { SITE } from "./site"

/** The daily send, in one place.
 *
 * Ported from tarot/send_daily.py, and shared by both things that trigger it:
 * the CLI (`pnpm daily`) and the cron route. Two copies of a send loop is two
 * chances to mail the list twice.
 *
 * What it will not do, all enforced here rather than remembered:
 *
 *   * send to anyone not confirmed -- the query excludes pending, unsubscribed
 *     and complained rows rather than filtering them afterwards;
 *   * send when the marketing and transactional senders share a domain, so one
 *     campaign cannot take the confirmation links down with it;
 *   * send without a per-recipient one-click unsubscribe;
 *   * send to the same person twice in a day, however many times it is
 *     triggered;
 *   * abort the whole run because one address failed.
 *
 * And `dry` defaults to true. A send function whose default behaviour is
 * "mail everyone" is one arrow-up away from a mistake with no undo.
 */

export interface SendOptions {
  /** Render and count, send nothing. The default, deliberately. */
  dry?: boolean
  /** Stop after this many recipients. 0 means no limit. */
  limit?: number
  /** Recipients per query page. */
  batch?: number
  /** Seconds between batches, to stay inside a provider's rate limit. */
  pause?: number
  /** Override the day, for testing. */
  day?: Date
  /** Called with each line of progress, so the CLI can print and the route
   *  can collect. */
  log?: (line: string) => void
}

export interface SendResult {
  ok: boolean
  day: string
  card: string
  reversed: boolean
  sent: number
  failed: number
  skipped: number
  dry: boolean
  reason?: string
  lines: string[]
}

/** Midnight UTC today. Everyone mailed at or after this instant has had
 *  today's card already, which is what makes a repeat trigger a no-op. */
function startOfDay(day: Date): string {
  return new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()),
  )
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z")
}

export async function sendDaily(options: SendOptions = {}): Promise<SendResult> {
  const {
    dry = true,
    limit = 0,
    batch = 100,
    pause = 1,
    day = new Date(),
    log,
  } = options

  const lines: string[] = []
  const say = (line: string) => {
    lines.push(line)
    log?.(line)
  }

  const card = cardOfTheDay(day)
  // The same card for everyone, and the same orientation: a "card of the day"
  // that is reversed for some readers and not others is two different days.
  const brief = briefFor(card, false)
  const stats = subscriberStats()
  const cutoff = startOfDay(day)
  const isoDay = cutoff.slice(0, 10)

  const result: SendResult = {
    ok: false,
    day: isoDay,
    card: card.name,
    reversed: false,
    sent: 0,
    failed: 0,
    skipped: 0,
    dry,
    lines,
  }

  say(`Daily card — ${isoDay}`)
  say(`  card:        ${card.name}`)
  say(`  colour:      ${brief.colour}  stone: ${brief.stone}`)
  say(
    `  subscribers: ${stats.confirmed ?? 0} confirmed of ${stats.total ?? 0} ` +
      `(${stats.pending ?? 0} pending, ${stats.unsubscribed ?? 0} unsubscribed)`,
  )

  if (!channelsAreSeparated()) {
    result.reason =
      "marketing and transactional share a sender domain — set MAIL_MK_FROM to a " +
      "separate domain, because a campaign must not be able to damage the " +
      "deliverability of confirmation links"
    say(`\nREFUSING TO SEND: ${result.reason}`)
    return result
  }

  if (dry) say("\nDRY RUN — nothing will be sent.")

  const reportUrl = `${SITE.url}/report`
  let afterId = 0

  for (;;) {
    // The cutoff is applied by the query, so a resumed run walks past everyone
    // already mailed today instead of re-sending to them.
    const page = confirmedSubscribers(batch, afterId, cutoff)
    if (page.length === 0) break
    afterId = page[page.length - 1].id
    const done: number[] = []

    for (const sub of page) {
      if (limit && result.sent >= limit) break
      const unsubscribeUrl = `${SITE.url}/unsubscribe?t=${sub.token}`

      if (dry) {
        result.sent++
        continue
      }

      const message = dailyEmail({ brief, day, reportUrl })
      try {
        await sendMarketing({
          to: sub.email,
          subject: message.subject,
          text: message.text,
          html: message.html,
          listUnsubscribe: `<${unsubscribeUrl}>`,
          listUnsubscribePost: true,
        })
        done.push(sub.id)
        result.sent++
      } catch (error) {
        // One bad address is not a reason to stop mailing the other 399,999.
        result.failed++
        say(`  ! ${sub.email}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Marked in a batch after the batch, so a crash mid-page costs at most one
    // page of duplicates rather than the whole run.
    markSent(done)
    if (limit && result.sent >= limit) break
    if (!dry && pause) await new Promise((r) => setTimeout(r, pause * 1000))
  }

  result.ok = result.failed === 0
  say(`\n${dry ? "would send" : "sent"}: ${result.sent}` +
    (result.failed ? `   failed: ${result.failed}` : ""))
  return result
}
