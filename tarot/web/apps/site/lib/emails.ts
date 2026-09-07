import "server-only"

import { RWS_AVAILABLE, type Brief } from "@arcana/core"

import { SITE } from "./site"
import { POSTAL_ADDRESS } from "./mailer"

/** The two emails this site sends, as HTML and as text.
 *
 * Ported from tarot/templates/emails/. Written by hand in tables and inline
 * styles because that is what mail clients render: Outlook still lays out with
 * Word, Gmail strips <style> blocks, and a flexbox layout that looks right in
 * a browser arrives as one column of unstyled text.
 *
 * Every send carries both parts. A text alternative is not a courtesy -- a
 * message with no plain-text part scores worse with spam filters, which for a
 * list this size is the difference between the inbox and the promotions tab.
 */

const INK = "#1B1815"
const PAPER = "#F7F4EA"
const GROUND = "#E6E3D5"
const RULE = "#ABA48D"
const MUTED = "#8B8676"
const ACCENT = "#B4442F"

const SERIF = "Georgia,'Times New Roman',serif"
const MONO = "'Courier New',monospace"

/** HTML-escape. Card text is our own, but the operator name and address come
 *  from environment variables, and an unescaped `&` in a company name is the
 *  kind of thing that renders as garbage in exactly one client. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function longDate(day: Date): string {
  return day.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

/** The sign-off every message carries.
 *
 * The postal address is not decoration: CAN-SPAM requires a real one in every
 * commercial message to a US recipient and gives no consent-based exception.
 * The mailer refuses to send marketing without it, so this renders whatever is
 * configured and the refusal happens upstream.
 */
function signOff(): { html: string; text: string } {
  const who = SITE.operator
  const where = POSTAL_ADDRESS.trim()
  return {
    html: `${esc(who)}${where ? `<br>${esc(where)}` : ""}`,
    text: [who, where].filter(Boolean).join("\n"),
  }
}

// ---------------------------------------------------------------------------
// The opt-in confirmation
// ---------------------------------------------------------------------------

export function confirmEmail(input: { confirmUrl: string; consentText: string }) {
  const sign = signOff()

  const text = [
    `You asked for the daily card from ${SITE.name}.`,
    "",
    `Confirm here: ${input.confirmUrl}`,
    "",
    "If this was not you, ignore this message — nothing will be sent, and",
    "nobody can add your address by asking on your behalf.",
    "",
    `What you agreed to: "${input.consentText}"`,
    "",
    "--",
    sign.text,
  ].join("\n")

  const html = `
<div style="margin:0;padding:24px;background:${GROUND};font-family:${SERIF};color:${INK}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto">
    <tr><td style="padding:0 0 18px;font-family:${MONO};font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${MUTED}">
      ${esc(SITE.name)}
    </td></tr>
    <tr><td style="background:${PAPER};border:1px solid ${RULE};padding:30px">
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:normal;line-height:1.2">One click and you are on the list</h1>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.65">
        You asked for the daily card. Confirm below and it starts tomorrow morning.
      </p>
      <p style="margin:0 0 22px">
        <a href="${esc(input.confirmUrl)}" style="display:inline-block;border:1px solid ${INK};color:${INK};text-decoration:none;padding:11px 22px;font-family:${MONO};font-size:11px;letter-spacing:.13em;text-transform:uppercase">Confirm my address</a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#5A5648">
        If this was not you, ignore this message. Nothing will be sent, and nobody
        can add your address by asking on your behalf.
      </p>
    </td></tr>
    <tr><td style="padding:18px 4px 0;font-family:${MONO};font-size:11px;line-height:1.75;color:${MUTED}">
      What you agreed to: &ldquo;${esc(input.consentText)}&rdquo;<br><br>
      ${sign.html}
    </td></tr>
  </table>
</div>`.trim()

  return { subject: "Confirm your daily card", html, text }
}

// ---------------------------------------------------------------------------
// The daily card
// ---------------------------------------------------------------------------

export function dailyEmail(input: {
  brief: Brief
  day: Date
  reportUrl: string
}) {
  const { brief, day } = input
  const name = brief.reversed ? `${brief.card.name}, reversed` : brief.card.name

  // An absolute URL, because an email has no origin to resolve against.
  //
  // WebP: every webmail and both mobile clients render it; Outlook's desktop
  // Word engine does not, and shows the alt text instead. That is the same
  // thing every reader with images off already sees, and the alt text is the
  // card's name -- which is the headline anyway. A card picture is worth that;
  // a second set of 78 PNGs, in the repository forever, is not.
  const art = RWS_AVAILABLE.has(brief.card.slug)
    ? `${SITE.url}/cards/rws/${brief.card.slug}.webp`
    : ""

  const text = [
    `${name} — ${longDate(day)}`,
    "",
    brief.body,
    "",
    `Keywords: ${brief.keywords.join(" / ")}`,
    `Colour:   ${brief.colour}`,
    `Stone:    ${brief.stone}`,
    `Metal:    ${brief.metal}`,
    "",
    "WHAT TO WATCH",
    brief.watch,
    "",
    "Today's card is the same for everyone. One drawn against your own question",
    `is not: ${input.reportUrl}`,
    "",
    "Correspondences are traditional associations, not remedies. For",
    "entertainment and reflection only — not advice, and not a prediction.",
    // The sender's postal address and the unsubscribe line are appended by
    // sendMarketing, to both parts. Repeating them here printed them twice.
  ].join("\n")

  const row = (label: string, value: string, last = false) => `
      <tr><td style="padding:5px 0;${last ? "" : `border-bottom:1px solid #CFC9B6;`}color:${MUTED};font-family:${MONO};font-size:10.5px;letter-spacing:.11em;text-transform:uppercase">${esc(label)}</td>
          <td align="right" style="padding:5px 0;${last ? "" : `border-bottom:1px solid #CFC9B6;`}">${value}</td></tr>`

  const colour = brief.hex
    ? `<span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:${esc(brief.hex)};border:1px solid ${INK};vertical-align:middle"></span><span style="vertical-align:middle;padding-left:6px">${esc(brief.colour)}</span>`
    : esc(brief.colour)

  const html = `
<div style="margin:0;padding:24px 24px 0;background:${GROUND};font-family:${SERIF};color:${INK}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto">
    <tr><td style="padding:0 0 18px;font-family:${MONO};font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${MUTED}">
      ${esc(SITE.name)} &middot; ${esc(longDate(day))}
    </td></tr>

    <tr><td style="background:${PAPER};border:1px solid ${RULE};padding:30px 30px 26px">
      <h1 style="margin:0 0 20px;font-size:28px;font-weight:normal;line-height:1.15">${esc(name)}</h1>

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          ${art ? `<td width="150" valign="top" style="padding-right:22px"><img src="${esc(art)}" width="150" alt="${esc(name)}" style="display:block;width:150px;height:auto;border:1px solid ${RULE}"></td>` : ""}
          <td valign="top">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.65">${esc(brief.body)}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-size:13.5px">${row("Colour", colour)}${row("Stone", esc(brief.stone))}${row("Metal", esc(brief.metal), true)}
            </table>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
        <tr><td style="border:1px dashed ${RULE};padding:16px 18px">
          <div style="font-family:${MONO};font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:${ACCENT};padding-bottom:7px">What to watch</div>
          <div style="font-size:15px;line-height:1.6">${esc(brief.watch)}</div>
        </td></tr>
      </table>

      <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#5A5648">
        Today&rsquo;s card is the same for everyone. One drawn against your own question is not.
      </p>
      <p style="margin:16px 0 0">
        <a href="${esc(input.reportUrl)}" style="display:inline-block;border:1px solid ${INK};color:${INK};text-decoration:none;padding:11px 22px;font-family:${MONO};font-size:11px;letter-spacing:.13em;text-transform:uppercase">Draw for my situation</a>
      </p>
    </td></tr>

    <tr><td style="padding:18px 4px 0;font-family:${MONO};font-size:11px;line-height:1.75;color:${MUTED}">
      Correspondences are traditional associations, not remedies. For entertainment
      and reflection only &mdash; not advice, and not a prediction.
    </td></tr>
  </table>
</div>`.trim()

  return { subject: name, html, text }
}
