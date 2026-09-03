"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { SPREADS, drawCards } from "@arcana/core"

import { clientIp, currentReader, isOperator } from "./auth"
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

  const token = createOrder(reader, {
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
  // Secure everywhere except an explicitly local host.
  //
  // Tying it to NODE_ENV instead means a production build reached over plain
  // HTTP sets a Secure cookie the browser silently drops, and sign-in fails
  // with no error visible anywhere. Keying it on the Host header rather than
  // x-forwarded-proto is deliberate: a forwarded-proto header is attacker-
  // supplied unless the proxy overwrites it, and trusting it would let a
  // request downgrade its own cookie.
  const host = (await headers()).get("host") ?? ""
  const local = host.startsWith("localhost:") || host.startsWith("127.0.0.1:")
  return [
    name,
    value,
    {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: !local,
      path: "/",
      maxAge,
    },
  ] as const
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
  setPayment(String(formData.get("token") ?? ""), "paid")
  revalidatePath("/admin", "layout")
}

export async function settle(formData: FormData) {
  if (!(await isOperator())) fail("/admin", "Not authorised.")
  settleReader(Number(formData.get("reader_id")))
  revalidatePath("/admin/payouts", "layout")
}

// --- list -------------------------------------------------------------------

export async function subscribeAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
  const token = subscribe(email, String(formData.get("source") ?? "web"), CONSENT_TEXT, await clientIp())
  if (!token) fail("/", "That does not look like an email address.")

  // The confirmation is transactional, not marketing: it is the one message a
  // pending row may receive, and it is what turns the row into consent.
  await sendTransactional({
    to: email.trim().toLowerCase(),
    subject: "Confirm your daily card",
    text:
      `You asked for the daily card from ${SITE.name}.\n\n` +
      `Confirm here: ${SITE.url}/subscribe/confirm?t=${token}\n\n` +
      `If this was not you, ignore this message — nothing will be sent.\n\n` +
      `What you agreed to: "${CONSENT_TEXT}"\n`,
  })
  redirect("/subscribe/sent")
}

export async function confirmAction(token: string) {
  return Boolean(confirmSubscriber(token, await clientIp()))
}

export async function unsubscribeAction(token: string) {
  return unsubscribe(token)
}
