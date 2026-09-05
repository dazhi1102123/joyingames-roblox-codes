import "server-only"

/** Two mail channels, kept apart by code rather than by discipline.
 *
 * Ported from tarot/mailer.py. Transactional mail (order receipts, opt-in
 * confirmations) and marketing mail (the daily card) must not share a sending
 * domain: one spam complaint against the daily send would otherwise take the
 * order receipts down with it, and a receipt that does not arrive is a refund
 * request. The separation is asserted at send time, not documented.
 */

export class MailError extends Error {}

export interface Message {
  to: string
  subject: string
  text: string
  html?: string
  /** Required on every marketing send. RFC 8058 one-click. */
  listUnsubscribe?: string
  listUnsubscribePost?: boolean
}

/** The sender's real postal address.
 *
 * CAN-SPAM requires a valid physical address in every commercial message to a
 * US recipient, and it is one of the few requirements with no consent-based
 * exception -- an opted-in subscriber does not waive it. The list is
 * international, so this applies to the whole send rather than to a segment.
 *
 * Left unset it blocks marketing rather than sending without it: a message
 * that cannot lawfully be sent is not improved by being sent anyway.
 */
export const POSTAL_ADDRESS = process.env.MAIL_POSTAL_ADDRESS ?? ""

interface Channel {
  from: string
  replyTo?: string
}

function domainOf(address: string): string {
  const match = address.match(/<([^>]+)>/)
  const bare = match ? match[1] : address
  return (bare.split("@")[1] ?? "").trim().toLowerCase()
}

const TX: Channel = {
  from: process.env.MAIL_TX_FROM ?? "Arcana Press <hello@localhost.test>",
  replyTo: process.env.MAIL_TX_REPLY_TO,
}

const MK: Channel = {
  from: process.env.MAIL_MK_FROM ?? "Arcana Press <daily@localhost-daily.test>",
  replyTo: process.env.MAIL_MK_REPLY_TO,
}

/** The guard. Both domains must exist and must differ. */
export function channelsAreSeparated(): boolean {
  const tx = domainOf(TX.from)
  const mk = domainOf(MK.from)
  return Boolean(tx) && Boolean(mk) && tx !== mk
}

interface Provider {
  readonly name: string
  send(channel: Channel, message: Message): Promise<void>
}

/** The default. Prints instead of sending, so every flow is walkable with no
 *  account anywhere -- and so a misconfigured staging box cannot mail a real
 *  person by accident. */
class ConsoleProvider implements Provider {
  readonly name = "console"
  async send(channel: Channel, message: Message) {
    const lines = [
      "".padEnd(70, "-"),
      `From:    ${channel.from}`,
      `To:      ${message.to}`,
      `Subject: ${message.subject}`,
    ]
    if (message.listUnsubscribe) {
      lines.push(`List-Unsubscribe: ${message.listUnsubscribe}`)
      if (message.listUnsubscribePost) {
        lines.push("List-Unsubscribe-Post: List-Unsubscribe=One-Click")
      }
    }
    lines.push("".padEnd(70, "-"), message.text, "".padEnd(70, "-"))
    console.log(lines.join("\n"))
  }
}

class ResendProvider implements Provider {
  readonly name = "resend"
  async send(channel: Channel, message: Message) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new MailError("RESEND_API_KEY is not set")

    const headers: Record<string, string> = {}
    if (message.listUnsubscribe) {
      headers["List-Unsubscribe"] = message.listUnsubscribe
      if (message.listUnsubscribePost) {
        headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"
      }
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: channel.from,
        to: [message.to],
        reply_to: channel.replyTo,
        subject: message.subject,
        text: message.text,
        html: message.html,
        headers,
      }),
    })
    if (!response.ok) {
      throw new MailError(`Resend returned ${response.status}: ${await response.text()}`)
    }
  }
}

function activeProvider(): Provider {
  return (process.env.MAIL_PROVIDER ?? "console") === "resend"
    ? new ResendProvider()
    : new ConsoleProvider()
}

/** Order receipts, opt-in confirmations, delivery notices. */
export async function sendTransactional(message: Message): Promise<void> {
  await activeProvider().send(TX, message)
}

/** The daily card and anything else promotional.
 *
 * Refuses to send if the channels share a domain, or if the message carries no
 * unsubscribe header. Both are hard errors rather than warnings: a marketing
 * send without one-click unsubscribe is a §7 UWG problem and a deliverability
 * problem at the same time.
 */
export async function sendMarketing(message: Message): Promise<void> {
  if (!channelsAreSeparated()) {
    throw new MailError(
      `MAIL_TX_FROM and MAIL_MK_FROM must use different domains. ` +
        `Got "${domainOf(TX.from)}" for both.`,
    )
  }
  if (!message.listUnsubscribe) {
    throw new MailError("a marketing message needs a List-Unsubscribe header")
  }
  if (!POSTAL_ADDRESS.trim()) {
    throw new MailError(
      "MAIL_POSTAL_ADDRESS is not set. Every commercial message needs the " +
        "sender's real postal address in the body (CAN-SPAM §7704(a)(5)); an " +
        "opted-in recipient does not waive it.",
    )
  }

  // Appended here rather than left to each template, so no future template can
  // forget it.
  const footer = `\n\n—\n${POSTAL_ADDRESS}\nYou are receiving this because you confirmed a subscription. Unsubscribe: ${message.listUnsubscribe.replace(/^<|>$/g, "")}\n`

  await activeProvider().send(MK, {
    ...message,
    text: message.text.trimEnd() + footer,
  })
}

export const channels = { tx: TX, mk: MK }
