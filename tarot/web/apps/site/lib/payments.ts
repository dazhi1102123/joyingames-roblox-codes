import "server-only"

import type { Order } from "./orders"

/** Payment providers behind one interface, so switching is a config change.
 *
 * Ported from tarot/payments.py, including its honesty about what is not
 * known: the Waffo request shapes below are GUESSES. Waffo confirmed in
 * writing that tarot is an allowed category but that WeChat Pay must be
 * excluded, and that they do not support split payouts -- which is why the
 * reader ledger exists. Their API reference was never reachable, so every
 * unverified constant is isolated here rather than spread through the code.
 */

export const WAFFO_OPEN_QUESTIONS = [
  "Base URL and API version",
  "Checkout session endpoint path",
  "Request body field names (amount, currency, reference, redirect URLs)",
  "Webhook signature header name and signing scheme",
  "Event names for paid and refunded",
  "Whether payment methods are excluded per-session or per-account",
  "Whether the reference we send is echoed back on the webhook",
] as const

export interface CheckoutSession {
  url: string
  reference: string
}

export interface PaymentProvider {
  readonly name: string
  /** True when the provider can actually be called -- credentials present. */
  configured(): boolean
  createCheckout(order: Order, opts: { successUrl: string; cancelUrl: string }):
    Promise<CheckoutSession>
  /** Verify a webhook and say what it means. Returns null if not verified. */
  verifyWebhook(body: string, headers: Headers):
    { event: string; reference: string } | null
}

/** The default, and a complete path rather than a stub.
 *
 * The operator marks orders paid in /admin. That is genuinely how a small
 * studio starts -- bank transfer, invoice, whatever -- and it means the whole
 * flow is walkable with no provider account at all.
 */
class ManualProvider implements PaymentProvider {
  readonly name = "manual"
  configured() {
    return true
  }
  async createCheckout(order: Order): Promise<CheckoutSession> {
    return { url: `/order/${order.token}?awaiting=1`, reference: order.token }
  }
  verifyWebhook() {
    return null
  }
}

/** Payment methods that must not be offered.
 *
 * Waffo's written answer: the category is allowed, but WeChat Pay is not
 * available for it. Encoded here rather than in a runbook, because a runbook
 * does not stop the next deploy from re-enabling it.
 */
export const WAFFO_EXCLUDED_METHODS = (
  process.env.WAFFO_EXCLUDED_METHODS ?? "wechat_pay"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

// --- The four unverified constants. Correct these against the real reference.
const WAFFO_BASE = process.env.WAFFO_BASE_URL ?? "https://api.waffo.ai/v1"
const WAFFO_CREATE_SESSION = process.env.WAFFO_CREATE_PATH ?? "/actions/checkout/create-session"
const WAFFO_SIGNATURE_HEADER = process.env.WAFFO_SIG_HEADER ?? "x-waffo-signature"
const WAFFO_PAID_EVENTS = new Set(
  (process.env.WAFFO_PAID_EVENTS ?? "checkout.completed,payment.succeeded").split(","),
)
const WAFFO_REFUND_EVENTS = new Set(
  (process.env.WAFFO_REFUND_EVENTS ?? "payment.refunded,charge.refunded").split(","),
)

class WaffoProvider implements PaymentProvider {
  readonly name = "waffo"

  configured() {
    return Boolean(process.env.WAFFO_API_KEY)
  }

  async createCheckout(
    order: Order,
    opts: { successUrl: string; cancelUrl: string },
  ): Promise<CheckoutSession> {
    if (!this.configured()) throw new Error("WAFFO_API_KEY is not set")

    const response = await fetch(WAFFO_BASE + WAFFO_CREATE_SESSION, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WAFFO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: order.price_cents,
        currency: order.currency,
        reference: order.token,
        description: `Tarot reading by ${order.reader_name}`,
        success_url: opts.successUrl,
        cancel_url: opts.cancelUrl,
        exclude_payment_methods: WAFFO_EXCLUDED_METHODS,
      }),
    })

    if (!response.ok) {
      throw new Error(
        `Waffo returned ${response.status}: ${(await response.text()).slice(0, 400)}`,
      )
    }
    const data = (await response.json()) as Record<string, any>
    const url = data.url ?? data.checkout_url ?? data.redirect_url
    if (!url) {
      throw new Error(
        `Waffo gave no checkout URL. Keys returned: ${Object.keys(data).join(", ")}`,
      )
    }
    return { url, reference: data.id ?? data.reference ?? order.token }
  }

  verifyWebhook(body: string, headers: Headers) {
    const signature = headers.get(WAFFO_SIGNATURE_HEADER)
    const secret = process.env.WAFFO_WEBHOOK_SECRET
    if (!signature || !secret) return null

    // HMAC-SHA256 over the raw body is the near-universal scheme, but Waffo's
    // has not been confirmed. Verified with a timing-safe compare either way:
    // a === on a signature leaks its bytes to a patient attacker.
    const crypto = require("node:crypto") as typeof import("node:crypto")
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex")
    const a = Buffer.from(signature.replace(/^sha256=/, ""))
    const b = Buffer.from(expected)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

    const payload = JSON.parse(body) as Record<string, any>
    const event = payload.type ?? payload.event ?? ""
    const reference = payload.reference ?? payload.data?.reference ?? ""
    if (!reference) return null
    if (WAFFO_PAID_EVENTS.has(event)) return { event: "paid", reference }
    if (WAFFO_REFUND_EVENTS.has(event)) return { event: "refunded", reference }
    return null
  }
}

const PROVIDERS: Record<string, PaymentProvider> = {
  manual: new ManualProvider(),
  waffo: new WaffoProvider(),
}

export function provider(): PaymentProvider {
  const chosen = process.env.PAYMENT_PROVIDER ?? "manual"
  return PROVIDERS[chosen] ?? PROVIDERS.manual
}
