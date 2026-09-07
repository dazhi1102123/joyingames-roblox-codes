"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { SPREADS, drawCards } from "@arcana/core"

import {
  SESSION_COOKIE,
  cookieOptions,
  endSession,
  issueLink,
  normaliseEmail,
  setAccountStatus,
  sweepSessions,
  tooSoonForLink,
} from "./accounts"
import { record } from "./audit"
import { clientIp, currentAccount, currentReader, isOperator, operatorName } from "./auth"
import { confirmEmail } from "./emails"
import { sendTransactional } from "./mailer"
import { createOrder, purgeExpired, setPayment, setStatus } from "./orders"
import { provider } from "./payments"
import { getReader, readerLoad } from "./readers"
import { settleReader } from "./payouts"
import { CONSENT_TEXT, confirmSubscriber, subscribe, unsubscribe } from "./subscribers"
import { SITE } from "./site"

/** Server actions. Every one of these re-checks authorisation itself: a server
 *  action is a public endpoint, and a hidden button is not access control.
 *
 * Failures redirect back with ?error= rather than returning a value. An action
 * bound to <form action> must return void, and a redirect carries the message
 * through a plain form POST with JavaScript switched off.
 */

const MAX_SITUATION = 4000

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`)
}

export async function placeOrder(formData: FormData) {
  purgeExpired()

  const slug = String(formData.get("reader") ?? "")
  const reader = getReader(slug)
  const back = `/readers/${slug}`
  if (!reader || !reader.active) fail("/readers", "That reader is not taking orders.")
  if (readerLoad(reader.id) >= reader.capacity) {
    fail(back, "That reader is fully booked right now.")
  }

  const situation = String(formData.get("situation") ?? "").trim()
  if (situation.length < 20) {
    fail(back, "Tell the reader a little more — at least a sentence or two.")
  }

  const spreadSlug = String(formData.get("spread") ?? "situation")
  const spread = SPREADS[spreadSlug]
  if (!spread) fail(back, "Unknown spread.")

  const buyer = await currentAccount()

  const token = createOrder(reader, {
    account_id: buyer?.id ?? null,
    focus: String(formData.get("focus") ?? "general").slice(0, 32),
    situation: situation.slice(0, MAX_SITUATION),
    tried: String(formData.get("tried") ?? "").trim().slice(0, MAX_SITUATION),
    birth_ymd: String(formData.get("birth") ?? "").slice(0, 10),
    spread_slug: spreadSlug,
    // Drawn now, at order time, so the reader and the customer see the same
    // cards. Re-drawing at delivery would make the reading unverifiable.
    drawn: drawCards(spread.count, true),
  })

  const checkout = await provider().createCheckout(
    { ...reader, token, price_cents: reader.price_cents, currency: reader.currency } as any,
    {
      successUrl: `${SITE.url}/order/${token}`,
      cancelUrl: `${SITE.url}/readers/${reader.slug}`,
    },
  )
  if (checkout.reference && checkout.reference !== token) {
    setPayment(token, "pending", checkout.reference)
  }
  redirect(checkout.url)
}

// --- desk -------------------------------------------------------------------

/** Setting a cookie is not enough to change what the next render shows.
 *
 * The client router caches an RSC payload per path. Redirecting back to a page
 * already visited while signed out replays that cached payload, so the sign-in
 * form renders again and the visitor concludes their key was rejected.
 * Invalidating the path first is what makes the session visible.
 */
async function sessionCookie(name: string, value: string, maxAge: number) {
  const host = (await headers()).get("host") ?? ""
  return [name, value, cookieOptions(host, maxAge)] as const
}

export async function signInReader(formData: FormData) {
  const jar = await cookies()
  jar.set(
    ...(await sessionCookie("desk_key", String(formData.get("key") ?? "").trim(), 60 * 60 * 24 * 30)),
  )
  revalidatePath("/desk", "layout")
  redirect("/desk")
}

export async function signOutReader() {
  const jar = await cookies()
  jar.delete("desk_key")
  revalidatePath("/desk", "layout")
  redirect("/desk")
}

export async function claimOrder(formData: FormData) {
  const reader = await currentReader()
  if (!reader) fail("/desk", "Not signed in.")
  const token = String(formData.get("token") ?? "")
  // setStatus re-checks the reader owns this order and that it is paid, so a
  // guessed token from another reader's queue gets nowhere.
  if (!setStatus(token, "claimed", { readerId: reader.id })) {
    fail("/desk", "That order cannot be claimed — it may be unpaid or already taken.")
  }
  revalidatePath("/desk", "layout")
}

export async function releaseOrder(formData: FormData) {
  const reader = await currentReader()
  if (!reader) fail("/desk", "Not signed in.")
  setStatus(String(formData.get("token") ?? ""), "open", { readerId: reader.id })
  revalidatePath("/desk", "layout")
}

export async function deliverOrder(formData: FormData) {
  const reader = await currentReader()
  if (!reader) fail("/desk", "Not signed in.")
  const token = String(formData.get("token") ?? "")
  const reading = String(formData.get("reading") ?? "")
  if (!setStatus(token, "delivered", { reading, readerId: reader.id })) {
    fail("/desk", "Could not deliver — an empty reading is not accepted.")
  }
  revalidatePath("/desk", "layout")
  revalidatePath(`/order/${token}`)
}

// --- operator ---------------------------------------------------------------

export async function signInOperator(formData: FormData) {
  const jar = await cookies()
  jar.set(
    ...(await sessionCookie("admin_key", String(formData.get("key") ?? "").trim(), 60 * 60 * 12)),
  )
  revalidatePath("/admin", "layout")
  redirect("/admin")
}

export async function markPaid(formData: FormData) {
  if (!(await isOperator())) fail("/admin", "Not authorised.")
  const token = String(formData.get("token") ?? "")
  setPayment(token, "paid")
  // Recorded after the fact rather than before: a line saying something
  // happened that then did not is worse than no line.
  record(await operatorName(), "order.mark_paid", token)
  revalidatePath("/admin", "layout")
}

export async function settle(formData: FormData) {
  if (!(await isOperator())) fail("/admin", "Not authorised.")
  const readerId = Number(formData.get("reader_id"))
  const settled = settleReader(readerId)
  record(
    await operatorName(),
    "payout.settle",
    String(readerId),
    `${settled.jobs} jobs, ${settled.cents} cents`,
  )
  revalidatePath("/admin/payouts", "layout")
}

export async function setAccountStatusAction(formData: FormData) {
  if (!(await isOperator())) fail("/admin/accounts", "Not authorised.")
  const id = Number(formData.get("account_id"))
  const status = String(formData.get("status")) === "banned" ? "banned" : "active"
  if (!Number.isInteger(id) || id <= 0) fail("/admin/accounts", "Unknown account.")
  setAccountStatus(id, status)
  record(await operatorName(), `account.${status}`, String(id))
  revalidatePath("/admin/accounts", "layout")
}

// --- list -------------------------------------------------------------------

export async function subscribeAction(formData: FormData) {
  const source = String(formData.get("source") ?? "web").slice(0, 64)

  // Where to send them if this fails. Only a same-site path is accepted: a
  // form field that becomes a redirect target is an open redirect unless it is
  // checked, and "//evil.test" is a path-looking string that leaves the site.
  const asked = String(formData.get("back") ?? "")
  const back = /^\/(?!\/)[\w\-/]*$/.test(asked) ? asked : "/"

  // The box is `required` in the markup, which stops a browser but not a
  // script. Consent is the thing being recorded, so it is checked where the
  // record is written rather than where it is displayed.
  if (formData.get("consent") !== "yes") {
    fail(back, "Tick the box to say you want the daily card.")
  }

  const email = String(formData.get("email") ?? "")
  const token = subscribe(email, source, CONSENT_TEXT, await clientIp())
  if (!token) fail(back, "That does not look like an email address.")

  // The confirmation is transactional, not marketing: it is the one message a
  // pending row may receive, and it is what turns the row into consent. It
  // goes out on the transactional channel for that reason -- a pending row has
  // consented to nothing yet.
  const message = confirmEmail({
    confirmUrl: `${SITE.url}/subscribe/confirm?t=${token}`,
    consentText: CONSENT_TEXT,
  })
  await sendTransactional({
    to: email.trim().toLowerCase(),
    subject: message.subject,
    text: message.text,
    html: message.html,
  })
  redirect("/subscribe/sent")
}

export async function confirmAction(token: string) {
  return Boolean(confirmSubscriber(token, await clientIp()))
}

export async function unsubscribeAction(token: string) {
  return unsubscribe(token)
}


// --- accounts ---------------------------------------------------------------

/** Ask for a sign-in link.
 *
 * The reply is the same whether or not the address is already known, and the
 * same whether or not the mail went out. Anything else turns this form into a
 * way to ask "does this person have an account here?", which for a tarot site
 * is a question worth refusing on its own.
 */
export async function requestSignInLink(formData: FormData) {
  sweepSessions()
  const email = normaliseEmail(String(formData.get("email") ?? ""))
  if (!email) fail("/account", "That does not look like an email address.")

  if (!tooSoonForLink(email)) {
    const link = issueLink(email)
    await sendTransactional({
      to: email,
      subject: "Your sign-in link",
      text:
        `Here is your link to sign in to ${SITE.name}:\n\n` +
        `${SITE.url}/account/callback?t=${link}\n\n` +
        `It works once and stops working in 15 minutes.\n\n` +
        `If you did not ask for this, ignore it — nothing has changed and\n` +
        `no account was created in your name by someone else asking.\n`,
    })
  }
  redirect("/account?sent=1")
}

export async function signOutAccount() {
  const jar = await cookies()
  endSession(jar.get(SESSION_COOKIE)?.value)
  jar.delete(SESSION_COOKIE)
  revalidatePath("/account", "layout")
  redirect("/account")
}
