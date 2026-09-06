# Payments, accounts, and the operator console

Four pieces, taken from the reference project (`joyinaigc`) and fitted to this
one. What was lifted is the *shape* of each — a provider behind an interface, an
email allowlist for operators, an audit line per action. What was not lifted is
its stack: that project is a Nest API over Prisma and Supabase driving a
client-side React app; this one is server-rendered forms over SQLite, and
copying its plumbing would have meant rewriting this app to suit a reference
rather than the other way round.

---

## 1. Waffo Pancake

Waffo is a merchant of record: it sells to the customer, charges the tax, and
settles to us. That is the reason to use it from China selling abroad — the
alternative is registering for VAT wherever a customer happens to live.

The previous version of `lib/payments.ts` was written against seven open
questions, each answered by a guess with a comment saying so. All seven are now
answered from the SDK, and **four of the guesses were wrong** in ways that would
have failed silently or late:

| Guessed | Actual |
|---|---|
| `Authorization: Bearer WAFFO_API_KEY` | Merchant id + RSA-SHA256 request signing with a PEM private key |
| HMAC-SHA256 webhook over a shared secret | Asymmetric — Waffo signs, we verify with its public key. There is no shared secret |
| `exclude_payment_methods` in the body, value `wechat_pay` | `excludePaymentMethods`, value `wechat` |
| `checkout.completed` / `payment.succeeded` | `order.completed`, `subscription.activated`, `subscription.payment_succeeded`; refund is `refund.succeeded` |

The one that mattered most is not in that table. Waffo charges a **product**,
created in its dashboard — and readers set their own prices. One product per
price would mean a new product every time someone edits their rate, and a
missing one charges whatever the product happens to say. `priceSnapshot`
overrides the amount per session instead, which is why there is exactly one
product id to configure.

Two details that only bite later:

- `orderMerchantExternalId` is inherited by every payment and refund on an
  order, which is what lets a refund three weeks on still name the order it
  belongs to. Our order token goes there.
- Prices go over as `"35.00"`, not `3500`. The field is a string and 3500 would
  be accepted — as three and a half thousand euros. `displayAmount` exists so
  that conversion can be checked rather than trusted.

### Configuration

| Variable | Effect |
|---|---|
| `PAYMENT_PROVIDER` | `manual` (default) or `waffo` |
| `WAFFO_MERCHANT_ID` | `MER_…` from the dashboard |
| `WAFFO_PRIVATE_KEY` | PEM private key. Server only — never prefix it `NEXT_PUBLIC_` |
| `WAFFO_PRODUCT_ID` | `PROD_…`; one product, priced per session |
| `WAFFO_TAX_CATEGORY` | defaults to `professional_service` — a written reading is a service, not a download |
| `WAFFO_EXCLUDED_METHODS` | defaults to `wechat` |
| `WAFFO_WEBHOOK_PUBLIC_KEY` | optional; the SDK ships Waffo's own |
| `WAFFO_BASE_URL` | optional override |

Point the dashboard's webhook at `/api/webhooks/payment`. Currency matters:
Waffo's one-time matrix gives EUR `card`/`applepay`/`googlepay`, and WeChat only
on CNY — so on the current EUR pricing the exclusion above is belt-and-braces,
and it starts mattering the day someone adds a CNY price.

If the private key has ever been pasted anywhere it should not have been,
regenerate it in the dashboard before putting it here.

`manual` remains the default and is a complete path, not a stub: the operator
marks orders paid in `/admin`. The whole flow is walkable with no Waffo account
at all.

---

## 2. Visitor accounts

Sign-in is a link in an email. No password — not for fashion, but because
there is nothing behind an account worth more than the mailbox it is addressed
to, so a password would only add something to steal.

- Accounts are created by asking for a link. Signing in and signing up are the
  same act; asking someone which one they are doing is a question with no
  answer behind it.
- Links last 15 minutes and work once. Sessions last 60 days.
- The database stores a **SHA-256 of each token**, never the token. A session
  table full of live tokens hands out accounts the moment it leaks, and this
  database is a file that ends up in backups.
- One link per address per minute, tracked on the account rather than the link
  row — a link that is spent deletes its row, so a cooldown kept there would
  reset exactly when the limited thing was used.
- Asking for a link says the same thing whether or not the address is known,
  and whether or not mail went out. Anything else makes the form a way to ask
  "does this person have an account here?", which for a tarot site is worth
  refusing on its own.

Accounts are a convenience and nothing more. Orders stay reachable by their
token whether or not anyone ever signs in, so losing the table loses nobody
their reading, and orders placed before signing in are not retroactively
claimed — that would mean asking people to prove which readings were theirs.

`/account/callback` is a route handler rather than a page because signing in
sets a cookie and a Server Component render may not. The constraint is right:
rendering must not have side effects, and this does.

---

## 3. Operators

Two ways in, both leading to the same console:

| | |
|---|---|
| `ADMIN_KEY` | a shared key in a cookie. Needs no mail server and no account — this is what gets the console open on day one |
| `ADMIN_EMAILS` | comma-separated allowlist. An operator signs in at `/account` like anyone else and the console recognises them |

Unset `ADMIN_EMAILS` means nobody qualifies that way. The other reading — unset
means everyone — is how an admin console ends up open to the internet.

The allowlist is what makes the audit trail worth having, because only it can
name a person. Every operator action writes one line: who, what, which target,
when. An action taken with the shared key records the actor as `admin key`,
which is honest about how much it knows; inventing a name there would be worse
than admitting it.

Recording is never allowed to fail the action it records. An operator who
cannot mark an order paid because the log is unhappy is a worse outcome than a
missing line.

`/admin/accounts` lists accounts and bans them. Banning drops every session that
account holds *and* the status is re-read on every request — two separate
guarantees, so a ban applied anywhere else (another instance, a restored
backup) takes effect immediately rather than in sixty days when the cookie
expires.

---

## 4. KIE

See `AI.md`. Short version: a fourth `AI_PROVIDER`, one key in front of
several vendors' models, useful when Anthropic and OpenAI each want their own
account and their own card.

---

## Checking it

```bash
pnpm build && pnpm verify
```

129 checks, of which the new ones cover: link single-use, session resolution,
the two ban guarantees separately, the cooldown, cookie `Secure` flags,
audit recording, provider configuration, and the cents-to-units conversion.
