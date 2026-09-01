"""Payment providers, behind one interface.

The single most important decision in this file is that there *is* a file. This
project sells something in a category that payment processors restrict, so the
provider will change at least once — under duress, probably, with live orders in
the queue. Switching has to be a config change, not a refactor.

Two providers ship:

  * ``manual``  — settlement happens out of band. No network calls, no keys, and
    the whole flow works end to end. This is the default and it is not a stub.
  * ``waffo``   — Waffo as Merchant of Record.

**The Waffo adapter is written against an unverified specification.** The
documentation hosts (docs.waffo.com, docs.waffo.ai) are unreachable from the
build environment, so the request shape below comes from public secondary
sources, not from reading the API reference. Every point that needs confirming
is marked ``UNVERIFIED`` and listed in ``WAFFO_OPEN_QUESTIONS``. Run

    python payments.py check

against a real key before trusting any of it. Until that passes, leave
``PAYMENT_PROVIDER=manual``.

Two questions were put to Waffo and answered:

  * **Category.** Tarot and spiritual content are permitted — with WeChat Pay
    excluded. That exclusion is enforced here (``WAFFO_EXCLUDED_METHODS``) rather
    than left to the dashboard, so it travels with the code and is visible in
    review. It also means mainland Chinese buyers lose their dominant method,
    which is an argument for leading with the English-language market.
  * **Splits.** Waffo does not support paying a third party a share. It settles
    the full amount to one payee, so the site is the seller and readers are
    subcontractors invoicing it — a studio, not a marketplace. What each reader
    is owed is tracked in ``store.py`` and paid out of band.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass

# Statuses an order's payment can be in. Anything else is a bug.
UNPAID = "unpaid"
PENDING = "pending"
PAID = "paid"
REFUNDED = "refunded"
FAILED = "failed"

PAYMENT_STATUSES = {UNPAID, PENDING, PAID, REFUNDED, FAILED}


@dataclass
class Checkout:
    """Where to send the buyer, and what to remember about it."""
    url: str
    reference: str
    status: str = PENDING


class PaymentError(RuntimeError):
    pass


# ---------------------------------------------------------------------------
# Manual settlement
# ---------------------------------------------------------------------------

class ManualProvider:
    """Records the intent to pay; money moves elsewhere.

    This is what runs while the provider question is open, and it is a complete
    path rather than a placeholder: an order is created, an operator confirms
    payment, and the reading proceeds.
    """

    name = "manual"
    is_live = False

    def __init__(self, config):
        self.config = config

    def create_checkout(self, order, return_url, cancel_url):
        return Checkout(url=return_url, reference=f"manual:{order['token']}",
                        status=UNPAID)

    def verify_webhook(self, headers, raw_body):
        # Nothing sends webhooks here. Refusing is the correct answer, not an
        # oversight: an endpoint that accepts unsigned "paid" events is a way to
        # get free readings.
        return None


# ---------------------------------------------------------------------------
# Waffo (Merchant of Record)
# ---------------------------------------------------------------------------

WAFFO_OPEN_QUESTIONS = [
    "Base URL: api.waffo.ai vs api.waffo.com — waffo.com and waffo.ai both "
    "appear to be Waffo properties and may be different products.",
    "Auth: whether the API key goes in Authorization: Bearer, or a bespoke "
    "header, and whether requests must additionally be signed.",
    "Whether X-Store-Slug and X-Environment are required on every call.",
    "The create-session response field holding the redirect URL.",
    "Webhook signature: header name, algorithm, and whether the signed payload "
    "is the raw body alone or is prefixed with a timestamp.",
    "Webhook event names for a completed payment and for a refund.",
    "The field name for excluding a payment method — excludedPaymentMethods "
    "is a guess, and getting it wrong silently re-enables WeChat Pay.",
]


class WaffoProvider:
    """Waffo as Merchant of Record.

    UNVERIFIED throughout — see the module docstring and WAFFO_OPEN_QUESTIONS.
    Correct the four constants below once the reference is in hand; nothing
    outside this class needs to change.
    """

    name = "waffo"
    is_live = True

    # --- the four things to correct against the real reference ---------------
    BASE_URL = "https://api.waffo.ai/v1"                      # UNVERIFIED
    CREATE_SESSION = "/actions/checkout/create-session"        # UNVERIFIED
    SIGNATURE_HEADER = "X-Waffo-Signature"                     # UNVERIFIED
    PAID_EVENTS = {"checkout.completed", "payment.succeeded"}  # UNVERIFIED
    REFUND_EVENTS = {"payment.refunded", "charge.refunded"}    # UNVERIFIED
    # -------------------------------------------------------------------------

    def __init__(self, config):
        self.api_key = config.get("WAFFO_API_KEY", "")
        self.store_slug = config.get("WAFFO_STORE_SLUG", "")
        self.environment = config.get("WAFFO_ENVIRONMENT", "sandbox")
        self.webhook_secret = config.get("WAFFO_WEBHOOK_SECRET", "")
        self.product_id = config.get("WAFFO_PRODUCT_ID", "")
        # Waffo permit this category on the condition that WeChat Pay is not
        # offered. Enforced in the request, not only in their dashboard.
        self.excluded_methods = [
            m.strip() for m in
            (config.get("WAFFO_EXCLUDED_METHODS") or "wechat_pay").split(",")
            if m.strip()
        ]
        if not self.api_key:
            raise PaymentError(
                "PAYMENT_PROVIDER=waffo but WAFFO_API_KEY is unset. "
                "Set it, or fall back to PAYMENT_PROVIDER=manual."
            )

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",   # UNVERIFIED
            "Content-Type": "application/json",
            "X-Store-Slug": self.store_slug,             # UNVERIFIED
            "X-Environment": self.environment,           # UNVERIFIED
        }

    def _post(self, path, payload, timeout=20):
        req = urllib.request.Request(
            self.BASE_URL + path,
            data=json.dumps(payload).encode(),
            headers=self._headers(),
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode() or "{}")
        except urllib.error.HTTPError as exc:
            body = exc.read().decode(errors="replace")[:500]
            raise PaymentError(f"Waffo {path} -> HTTP {exc.code}: {body}") from exc
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            raise PaymentError(f"Waffo {path} unreachable: {exc}") from exc

    def create_checkout(self, order, return_url, cancel_url):
        payload = {                                      # UNVERIFIED field names
            "productId": self.product_id,
            "productType": "one_time",
            "currency": order["currency"],
            "amount": order["price_cents"],
            "referenceId": order["token"],
            "successUrl": return_url,
            "cancelUrl": cancel_url,
            "excludedPaymentMethods": self.excluded_methods,   # UNVERIFIED name
        }
        data = self._post(self.CREATE_SESSION, payload)

        url = _first(data, "checkoutUrl", "url", "redirectUrl", "paymentUrl")
        ref = _first(data, "sessionId", "id", "sessionToken") or order["token"]
        if not url:
            raise PaymentError(
                f"Waffo create-session returned no redirect URL. Keys present: "
                f"{sorted(data)[:12]}. Correct the field name in WaffoProvider."
            )
        return Checkout(url=url, reference=str(ref), status=PENDING)

    def verify_webhook(self, headers, raw_body):
        """Return (reference, payment_status) or None.

        Fails closed: without a configured secret, or on any signature mismatch,
        the event is discarded. A webhook that can be forged is a way to get
        paid-tier work for free.
        """
        if not self.webhook_secret:
            return None
        sent = headers.get(self.SIGNATURE_HEADER, "")
        if not sent:
            return None

        expected = hmac.new(self.webhook_secret.encode(), raw_body,
                            hashlib.sha256).hexdigest()          # UNVERIFIED
        if not hmac.compare_digest(sent.strip().lower(), expected):
            return None

        try:
            event = json.loads(raw_body.decode())
        except (ValueError, UnicodeDecodeError):
            return None

        kind = str(_first(event, "type", "event", "eventType") or "")
        data = event.get("data") or event
        reference = _first(data, "referenceId", "reference", "metadata_reference")
        if not reference:
            return None

        if kind in self.PAID_EVENTS:
            return str(reference), PAID
        if kind in self.REFUND_EVENTS:
            return str(reference), REFUNDED
        return None


def _first(mapping, *keys):
    """First present, non-empty value among `keys`. Tolerates naming drift."""
    if not isinstance(mapping, dict):
        return None
    for k in keys:
        v = mapping.get(k)
        if v:
            return v
    return None


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

PROVIDERS = {"manual": ManualProvider, "waffo": WaffoProvider}


def get_provider(config):
    name = (config.get("PAYMENT_PROVIDER") or "manual").strip().lower()
    if name not in PROVIDERS:
        raise PaymentError(
            f"Unknown PAYMENT_PROVIDER {name!r}. Known: {', '.join(sorted(PROVIDERS))}"
        )
    return PROVIDERS[name](config)


# ---------------------------------------------------------------------------
# Live check
#
# The point of this command is to find out which of WAFFO_OPEN_QUESTIONS were
# guessed wrong, using one real request, before any customer sees a checkout.
# ---------------------------------------------------------------------------

def check(config=None):
    config = config or dict(os.environ)
    print("Waffo adapter check\n" + "=" * 60)
    print("The request shape below is UNVERIFIED. Open questions:")
    for i, q in enumerate(WAFFO_OPEN_QUESTIONS, 1):
        print(f"  {i}. {q}")
    print("=" * 60)

    missing = [k for k in ("WAFFO_API_KEY", "WAFFO_STORE_SLUG", "WAFFO_PRODUCT_ID")
               if not config.get(k)]
    if missing:
        print(f"\nNot configured: {', '.join(missing)}")
        print("Set them and re-run to make a real request.")
        return 1

    provider = WaffoProvider(config)
    print(f"\nPOST {provider.BASE_URL}{provider.CREATE_SESSION}")
    print(f"  environment: {provider.environment}")
    print(f"  excluding:   {', '.join(provider.excluded_methods) or '(nothing)'}")
    fake = {"token": "check-" + "0" * 8, "price_cents": 100, "currency": "EUR"}
    try:
        result = provider.create_checkout(
            fake, "https://example.invalid/ok", "https://example.invalid/cancel")
    except PaymentError as exc:
        print(f"\nFAILED: {exc}")
        print("\nThat error is the useful output — it names which assumption is "
              "wrong. Correct the constants in WaffoProvider and re-run.")
        return 1

    print(f"\nOK  redirect: {result.url[:80]}\n    reference: {result.reference}")
    print("\nStill unconfirmed by this check:")
    print("  - webhook signature scheme and event names — send a sandbox payment")
    print("    and inspect a real delivery.")
    print("  - that the exclusion was honoured. OPEN THE CHECKOUT PAGE and confirm")
    print("    WeChat Pay is absent. A silently ignored field looks like success")
    print("    here and breaks the category approval in production.")
    return 0


if __name__ == "__main__":
    sys.exit(check() if len(sys.argv) > 1 and sys.argv[1] == "check" else check())
