import "server-only"

import { WaffoPancake, verifyWebhook, TaxCategory, type PaymentMethod } from "@waffo/pancake-ts"

import type { Order } from "./orders"

/** Taking money, behind one interface.
 *
 * The default provider settles by hand. That is not a stub standing in for the
 * real thing -- it is how a small studio actually starts, and it means the
 * whole order flow is walkable with no provider account at all.
 */

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

// ---------------------------------------------------------------------------
// Waffo Pancake
//
// Waffo is a merchant of record: it sells to the customer, handles the tax, and
// settles to us. That is the point of it for a Chinese entity selling to
// customers abroad -- the alternative is registering for VAT in every country a
// customer happens to live in.
//
// Everything below is the SDK's documented shape rather than a guess. Four
// things about it are not what a general payments intuition would predict, and
// each one is a silent failure if you get it wrong:
//
//  1. Auth is RSA-SHA256 request signing with a merchant id and a PEM private
//     key -- not a bearer API key. The key never leaves the server.
//  2. Checkout charges a *product*, created in Waffo's dashboard. A reader sets
//     their own price, so one product per price would mean a new product every
//     time someone edits their rate, and a missing one would charge whatever
//     the product happens to say. `priceSnapshot` overrides the amount per
//     session instead, which is why there is exactly one product id below.
//  3. The webhook signature is asymmetric: Waffo signs with its private key and
//     we verify with its public one. There is no shared secret to configure and
//     nothing for us to keep -- an HMAC scheme here would be inventing a secret
//     that does not exist.
//  4. `orderMerchantExternalId` is inherited by every payment and refund on the
//     order, which is what lets a refund three weeks later still name the order
//     it belongs to.
// ---------------------------------------------------------------------------

/** Payment methods that must not be offered.
 *
 * Waffo's answer was that the category is allowed but WeChat Pay is not
 * available for it. Encoded here rather than in a runbook, because a runbook
 * does not stop the next deploy from re-enabling it.
 *
 * On EUR this is belt-and-braces: WeChat is a CNY-only method in Waffo's
 * matrix, so the currency already excludes it. It matters the day someone adds
 * a CNY price.
 */
export const WAFFO_EXCLUDED_METHODS = (
  process.env.WAFFO_EXCLUDED_METHODS ?? "wechat"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean) as PaymentMethod[]

/** A tarot reading is a service someone writes, not a downloaded file.
 *
 * This drives the tax Waffo charges the customer, so it is a business answer
 * rather than a technical one -- overridable, but not silently.
 */
const WAFFO_TAX_CATEGORY = (process.env.WAFFO_TAX_CATEGORY ??
  TaxCategory.ProfessionalService) as TaxCategory

const WAFFO_SIGNATURE_HEADER = "x-waffo-signature"

/** Cents to the display string Waffo prices in ("35.00", not 3500).
 *
 * Its own name for the field is `amount: string`, and handing it 3500 would be
 * accepted -- as thirty-five hundred euros. Nothing errors, the customer sees
 * the wrong number at the last possible moment, and the only signal is a
 * chargeback. Worth a named function so it can be checked.
 */
export function displayAmount(cents: number): string {
  return (cents / 100).toFixed(2)
}

/** Events that mean money moved, and which way.
 *
 * `subscription.*` are here because the same product can later be sold as a
 * standing monthly reading; on a one-off order they simply never arrive.
 */
const WAFFO_PAID_EVENTS = new Set([
  "order.completed",
  "subscription.activated",
  "subscription.payment_succeeded",
])
const WAFFO_REFUND_EVENTS = new Set(["refund.succeeded"])

class WaffoProvider implements PaymentProvider {
  readonly name = "waffo"

  configured() {
    return Boolean(
      process.env.WAFFO_MERCHANT_ID &&
        process.env.WAFFO_PRIVATE_KEY &&
        process.env.WAFFO_PRODUCT_ID,
    )
  }

  private client(): WaffoPancake {
    return new WaffoPancake({
      merchantId: process.env.WAFFO_MERCHANT_ID!,
      privateKey: process.env.WAFFO_PRIVATE_KEY!,
      ...(process.env.WAFFO_BASE_URL ? { baseUrl: process.env.WAFFO_BASE_URL } : {}),
      ...(process.env.WAFFO_WEBHOOK_PUBLIC_KEY
        ? { webhookPublicKey: process.env.WAFFO_WEBHOOK_PUBLIC_KEY }
        : {}),
    })
  }

  async createCheckout(
    order: Order,
    opts: { successUrl: string; cancelUrl: string },
  ): Promise<CheckoutSession> {
    if (!this.configured()) {
      throw new Error(
        "Waffo is not configured (needs WAFFO_MERCHANT_ID, WAFFO_PRIVATE_KEY, WAFFO_PRODUCT_ID)",
      )
    }

    const session = await this.client().checkout.anonymous.create({
      productId: process.env.WAFFO_PRODUCT_ID!,
      currency: order.currency,
      // The amount the customer actually sees on the reader's page. Without
      // this the product's own price is charged, and the mismatch shows up as
      // a chargeback rather than an error.
      priceSnapshot: {
        amount: displayAmount(order.price_cents),
        taxCategory: WAFFO_TAX_CATEGORY,
      },
      successUrl: opts.successUrl,
      // Inherited by every payment and refund on this order, so a refund weeks
      // later still names the order it belongs to.
      orderMerchantExternalId: order.token,
      metadata: { token: order.token, reader: order.reader_slug },
      ...(WAFFO_EXCLUDED_METHODS.length
        ? { excludePaymentMethods: WAFFO_EXCLUDED_METHODS }
        : {}),
    })

    // The session id, not the order token: the token is already the order's
    // primary key, and storing it as the payment reference would tell us
    // nothing new. orderByPaymentRef matches either.
    return { url: session.checkoutUrl, reference: session.sessionId }
  }

  verifyWebhook(body: string, headers: Headers) {
    // Asymmetric: Waffo signs `${t}.${rawBody}` with its private key and we
    // check it against the public one the SDK ships. Throws on a bad
    // signature, a missing header, or a timestamp outside the tolerance --
    // all of which mean the same thing here.
    let event
    try {
      event = verifyWebhook(body, headers.get(WAFFO_SIGNATURE_HEADER))
    } catch {
      return null
    }

    const data = (event.data ?? {}) as {
      orderMerchantExternalId?: string
      orderMetadata?: Record<string, string>
    }
    // Order-level and inherited, so this is set on refunds too. The metadata
    // copy is the fallback for the same reason it exists in the first place.
    const reference = data.orderMerchantExternalId || data.orderMetadata?.token || ""
    if (!reference) return null

    if (WAFFO_PAID_EVENTS.has(event.eventType)) return { event: "paid", reference }
    if (WAFFO_REFUND_EVENTS.has(event.eventType)) return { event: "refunded", reference }
    // Everything else -- past_due, plan changes, cancellations -- is a real
    // event we simply have no state for. Not an error.
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

/** What /admin shows. A provider selected but not configured is the failure
 *  worth surfacing: checkout throws, and it throws at the worst moment. */
export function paymentStatus() {
  const chosen = process.env.PAYMENT_PROVIDER ?? "manual"
  const active = provider()
  return { requested: chosen, active: active.name, configured: active.configured() }
}
