# Arcana Press

An online tarot site: a reading engine, a programmatic content library, a queue
for readings written by people, and a mailing list — one small Flask app over
SQLite, with no external service required to run it.

## Run it locally

```bash
./dev.sh
```

That is the whole thing. It creates a virtualenv, installs dependencies, writes
a `.env` with generated secrets, seeds three readers and one order at each stage
of the flow, prints the keys you need, and starts the server on
<http://localhost:5000>. Re-running never overwrites your `.env` and never
re-seeds a database that already has orders in it.

No API keys anywhere. Payment runs in `manual` mode and email prints to the
terminal, so every flow is walkable without an account at any provider.

`requirements.txt` is deliberately one package. Flask is the only hard
requirement; gunicorn and the model client live in `requirements-full.txt` and
are what Docker installs. Gunicorn cannot run on Windows at all, and a heavy
optional dependency is the likeliest thing to break a first-time setup.

**On Windows**, double-click `启动.bat` instead of running `dev.sh`.

Worth opening, in order:

| | |
|---|---|
| `/reading/celtic-cross` | draw ten cards and watch the reading stream in |
| `/report` | describe a situation, get a written report back |
| `/readers` | order a reading from a person, then pay it through `/admin` |
| `/desk` | the reader's queue — key printed by the seed step |
| `/admin` · `/admin/payouts` | settlement and the reader ledger |
| `/legal/privacy` | the red MISSING markers are the fields you still owe |

```bash
python send_daily.py     # dry run; prints the daily email
python mailer.py         # checks the two channels are properly separated
```

### With Docker instead

```bash
cp .env.example .env     # then set SECRET_KEY and ADMIN_KEY
docker compose up -d --build
docker compose exec web python seed_readers.py
docker compose exec web python seed_demo.py
```

**Seed inside the container, not on the host.** In Docker the database lives on
a named volume at `/data`; running the seed scripts on the host would write to a
different file and the readers would never appear.


---

## What's here

| | |
|---|---|
| **78 cards** | Full corpus in `tarot_data.py`: upright/reversed keywords and meanings, per-context readings for love, career, money, health and yes-or-no, element, astrology, suit. |
| **6 spreads** | Daily draw, three-card, yes/no, situation-action-outcome, relationship (5), Celtic Cross (10). Each position carries its own question. |
| **468 indexable card pages** | 78 cards × 6 contexts, composed server-side with schema.org `Article` + `BreadcrumbList`. |
| **6,084 combination routes** | `/combinations/<a>/<b>` resolves for every ordered pair. Sitemap inclusion is staged — see below. |
| **An original deck** | 78 card faces drawn as SVG in `cardart.py`. ~1.5 KB each, vector, themed from CSS custom properties. No image assets, no licensing question. |
| **Reading engine** | Cryptographic draw, deal/flip animation, streamed interpretation, local reading history. |
| **Birth cards** | Traditional (Arrien/Greer) calculation plus 366 indexable date pages — the persistent card identity tarot otherwise lacks. |
| **Your deck** | Pattern read across your own reading history: recurring cards, suit balance, reversal rate. Entirely client-side. |
| **Share links** | A reading packs into a 6–15 character URL. Deterministic, so the link always renders the same draw. |
| **Card of the day** | Deterministic per date — stable across reloads, devices and the whole audience. |
| **Written report** | Intake form (area, situation, what you already tried, birth date) then a full report drawn against what you described. |
| **Correspondences** | Colour, stone and metal for all 78 cards, derived from planetary/zodiacal attribution and suit element — the content a daily brief and a physical product both need. |
| **Daily brief** | `/daily` renders exactly what a daily email would contain, so the content engine can be reviewed before any send channel exists. |
| **Human readings** | A small hand-picked roster, an async queue, and a reader desk. Cards are drawn instantly; a person writes the interpretation. |
| **The list** | Double opt-in capture on the report and daily pages, one-click unsubscribe, and a daily send that refuses to run unsafely. |
| **Crawl surface** | Sharded sitemap, robots.txt, canonical tags, `noindex` on the interactive routes. |

## What's deliberately *not* here

Accounts, payments, subscriptions and email. Not because they're hard — because
each one depends on a decision that hasn't been made yet:

- **Payments** need the provider decision first. Tarot sits on Stripe's restricted
  list, so the choice between a merchant-of-record and a high-risk acquirer
  determines the integration. Build the `payments/` provider abstraction before
  wiring any one of them.
- **Accounts** need the legal entity decision, because the privacy policy,
  the data-controller identity and the retention rules follow from it.
- **Email** needs the transactional/marketing split set up as two isolated
  services on separate domains. The *content* for a daily send is built and
  reviewable at `/daily`; only the channel is missing.
- **Email capture on the report** is deliberately absent. Storing an address makes
  you a data controller, and doing that before the operating entity and privacy
  policy exist is the wrong order. The report page has the slot; nothing fills it
  yet, and nothing the visitor types is persisted.

`/my-deck` deliberately works without an account — history lives in the visitor's
browser. That is the right default for a cold-start product, and it is also the
thing accounts would upgrade first: the history is what makes leaving expensive.

The reading engine and content library don't depend on any of those, which is
why they're built first.

---

## Layout

```
app.py           routes, draw mechanics, interpretation, sitemap
correspondences.py  colour / stone / metal per card, and the "what to watch" line
tarot_data.py    78 cards, 6 spreads, contexts — the single source of truth
cardart.py       SVG card faces (22 major emblems, 4 suit glyphs, pip layouts)
personal.py      birth cards, share codec, card of the day
envfile.py       loads .env before anything reads the environment
mailer.py        two isolated email channels; console / smtp / resend
dev.sh           one-command local run
seed_demo.py     example orders, so admin and desk are not empty
send_daily.py    the daily card send (dry run unless --send)
store.py         SQLite: readers, order queue, state machine, retention
seed_readers.py  create example readers and print their desk keys
templates/       Jinja templates
static/          styles.css, app.js (theme), reading.js (stage), mydeck.js (history)
```

A correction to a card's meaning goes in `tarot_data.py` and propagates to the
card page, the combination pages, the reading and the model prompt at once.

## Interpretation

Two paths, and the site is fully functional on either:

1. **Composed** (default) — `compose_reading()` builds the reading from the card
   corpus: position, orientation, meaning, then a synthesis pass that reads the
   spread as a whole (major-arcana density, suit dominance, reversal ratio).
2. **Model** — set `OPENAI_API_KEY` and interpretations stream from the model
   instead, with the composed reading as the fallback on *any* error.

The composed path is not a placeholder. It's the floor, it always runs, and it's
what makes the site work with zero configuration.

### Why content pages never call the model

SEO pages are composed synchronously from `tarot_data` with no model call in the
request path. Three reasons: crawlers need a stable low TTFB; a URL whose content
changes every fetch gets treated as unstable; and 8,000 pages × a model call per
crawl is unbounded cost. The model runs only on `/reading/*`, which is `noindex`
and doesn't need to be fast for a bot.

## The personalisation problem, and what solves it

Astrology apps hang everything on the natal chart: a permanent, unique object
derived from birth data. Daily personalisation, compatibility, the social graph —
all of it needs that object to exist.

Tarot has no equivalent. A draw is random and the deck is the same 78 cards for
everyone, so there is nothing to personalise *against*. Three things here build
that missing layer:

1. **Birth cards** (`/birth-card`) — a permanent card identity from a birth date,
   using the traditional method rather than something invented for the site. It
   doubles as an email-capture hook that is not a paywall, and generates 366 date
   pages whose content genuinely varies by year.
2. **Your deck** (`/my-deck`) — patterns across your own history. This is the one
   that compounds: a natal chart is fixed at signup and never grows, but a reading
   history gets richer with use.
3. **Share links** (`/r/<code>`) — a reading survives as an object someone else can
   open, without requiring either party to have an account.

## Human readings

A queue with a hand-picked roster, deliberately not a marketplace. At three to
eight readers, star ratings are noise and a booking calendar is overhead that
buys nothing — what someone wants is a named person and a delivery date.

The flow: the visitor picks a reader and describes their situation → the site
draws the cards immediately, so they see their spread while they wait → the
reader claims it from their desk, writes the interpretation, delivers. An order
moves `open → claimed → delivered`, and `store.TRANSITIONS` is the only authority
on what may follow what; anything else is refused rather than written.

**Data kept to the floor.** No account, no password, no email address. A request
is reached by an unguessable link that is also the delivery mechanism. Readers
sign in with a rotatable access key — a password store for eight people is a
liability with no upside. Every order carries an expiry and is *deleted* after
`ORDER_RETENTION_DAYS` (90 by default), and that deletion runs on the request
path rather than in a cron job, because a retention policy nobody remembers to
run is not a policy.

The desk shows the generated reading as a collapsed draft. That is a starting
point, not a shortcut: it goes out under a person's name, and the whole reason
someone paid for this tier is that a person read it.

### Payment

Providers live behind one interface in `payments.py` and are chosen with
`PAYMENT_PROVIDER`. That indirection matters more here than in most projects:
this sells in a category processors restrict, so the provider will change at
least once, probably in a hurry, with live orders in the queue.

**`manual`** (default) is a complete path, not a stub. An order is created
unpaid, money moves out of band, and an operator confirms it at `/admin`
(gated by `ADMIN_KEY`; unset means the route does not exist).

**`waffo`** integrates Waffo as Merchant of Record. **This adapter is written
against an unverified specification** — docs.waffo.com and docs.waffo.ai are
unreachable from the build environment, so the request shape comes from public
secondary sources rather than the API reference. Every guess is marked
`UNVERIFIED` in `payments.py` and listed in `WAFFO_OPEN_QUESTIONS`. Before
switching:

```bash
python payments.py check      # one real request; the error names the wrong guess
```

Two questions were put to Waffo and answered, and both shape the product rather
than just the code:

- **Category: permitted, with WeChat Pay excluded.** Enforced in the checkout
  request via `WAFFO_EXCLUDED_METHODS`, not left to a dashboard setting, so it
  travels with the code. `payments.py check` cannot confirm the field name was
  right — a silently ignored field looks identical to success — so open a real
  checkout and confirm WeChat Pay is absent before going live. Losing WeChat Pay
  also costs mainland Chinese buyers their dominant method, which is another
  argument for leading with the English-language market.
- **Splits: not supported.** Waffo settles the full amount to one payee. That
  makes the site the seller and readers subcontractors who invoice it — a studio,
  not a marketplace — and it is why the payout ledger below exists.

### The payout ledger

Because the provider will not split, what each reader is owed is tracked in the
database and paid out of band. Each order snapshots the reader's fee at creation,
so changing a reader's rate never rewrites what was already earned. `/admin/payouts`
shows what is owed per reader and records settlement; it is a ledger, not a
payment rail — marking paid out says money moved, it does not move it.

Two consequences that are not code:

- The site owes readers for delivered work **whether or not the customer later
  refunds**. That risk sits with you now, not with a marketplace intermediary.
- Readers working exclusively, to a fixed schedule, and integrated into your
  processes can be reclassified as employees under German law
  (*Scheinselbständigkeit*). How the arrangement is actually run matters more
  than how the contract is worded.

Payment gates the work, not the draw: cards are drawn immediately, but an order
is withheld from the reader's queue until paid, and `store.set_status` refuses to
claim an unpaid order even with a valid token — nobody should spend an hour on a
reading that was never paid for. Delivery is deliberately *not* gated, so a
refund after the fact cannot trap a reading the reader already wrote.

Set `HUMAN_READINGS=0` to hide the whole feature.

## Email

Two channels with separate credentials, senders and **domains**, and the code
refuses to send marketing when those domains match. That check lives in
`mailer.send_marketing` rather than in a runbook, because a runbook does not stop
a tired person at 2am, and the failure it prevents is not recoverable: one bad
campaign takes the confirmation links down with it.

| | carries | if it breaks |
|---|---|---|
| `MAIL_TX_*` | confirmation links, delivered readings | the product stops working |
| `MAIL_MK_*` | the daily card | a campaign pauses |

Providers: `console` (prints, the default so nothing leaks by accident), `smtp`,
`resend`. Check both with `python mailer.py` — set `MAIL_CHECK_TO` to receive one
of each.

### Consent

Double opt-in throughout. A pending row receives exactly one message, the
confirmation, and nothing else; it is excluded from sends by the query rather
than filtered afterwards. Each row stores the address, the moment, the IP, and
**the exact sentence the person agreed to** — under German §7 UWG the burden of
proving consent is the sender's, and "they ticked a box" is not proof without
those four things.

Unsubscribing is one click and immediate. RFC 8058 (`List-Unsubscribe-Post`) is
set on every marketing message, so a mail client can POST the opt-out directly
with no browser; Gmail, Yahoo and Microsoft all require it of bulk senders.
Re-subscribing an unsubscribed address returns it to *pending*, never straight to
confirmed — leaving takes one click, coming back requires proving the mailbox
again.

The subscribe endpoint returns the same page whether or not the address was
already on the list. Anything else turns the form into a membership oracle.

### Sending

```bash
python send_daily.py                 # dry run — renders, sends nothing
python send_daily.py --send          # sends
python send_daily.py --send --limit 50
```

Dry run is the default because a campaign script whose no-argument behaviour is
"mail everyone" is one arrow-up away from a mistake with no undo.

### Card art outside the site

`cardart.card_svg` normally emits CSS custom properties so a card repaints itself
per theme. **Email has no stylesheet**, so there those resolve to nothing and
every card renders as a solid black rectangle. Anything drawing a card outside
the site must pass `inline=True`, which substitutes literal values. This was a
real bug, caught by rendering the email rather than by testing that it rendered.

## The claims boundary

`correspondences.py` attaches a colour and a stone to every card. That content
exists so a daily brief has something concrete to say and so a physical product
has a defensible reason to sit next to a reading. It creates a line that the copy
must not cross:

> Correspondences are **traditional associations, not remedies**. Write "the stone
> associated with this card"; never "wear this to attract", "this protects you
> from", or anything implying a colour or an object changes an outcome.

This is not only editorial taste. Efficacy claims attached to a sold object are
misleading-advertising exposure (in Germany, §5 UWG on top of the §7 email rules),
and they are exactly the pattern that gets a merchant account reviewed. The
constant `correspondences.SAFE_FRAMING` states the rule in code so it travels with
the module; every template that renders a stone also renders the disclaimer.

The same boundary applies to "what to watch": it is composed from the card's own
reversed keywords — the failure mode of its upright meaning — and phrased as an
observation. It never predicts an event.

## Staging the combination pages

All 6,084 combination routes resolve immediately. What's *submitted* for indexing
is controlled by `COMBO_SITEMAP_SCOPE`:

| value | pages in sitemap | when |
|---|---|---|
| `none` | 0 | launch — get the 468 card pages indexed first |
| `majors` | 484 | default — once card-page indexation is healthy |
| `all` | 6,084 | only once single-card indexation is proven above ~70% |

Publishing all of them at once is the fastest way to get the whole site
classified as thin content. Check Search Console before each step up.

## Configuration

See `.env.example`. Everything has a working default except `PUBLIC_SITE_URL`,
which must be set for correct canonical tags and sitemap URLs.

## Deployment notes

- Gunicorn runs with threads rather than extra workers: `/api/interpret` holds a
  connection open while it streams, so the server needs concurrency, not CPU.
- Put a reverse proxy in front and disable response buffering for
  `/api/interpret`, or streaming will be buffered into a single slow response.
  The app already sends `X-Accel-Buffering: no` for nginx.
- `/healthz` reports card count, spread count, indexable URL count and whether a
  model key is configured.

## Before this goes live

- [ ] `templates/legal.html` contains **placeholders**, not legal text. Terms and
      Privacy must be completed and reviewed by counsel. In Germany the Impressum
      is mandatory and its absence is independently actionable.
- [ ] Set `PUBLIC_SITE_URL` and submit the sitemap to Search Console.
- [ ] Decide the operating entity before collecting a single email address.
- [ ] The disclaimer and the 18+ notice are load-bearing for payment-provider
      approval as well as for liability. Don't quietly drop them.
- [ ] Set `SECRET_KEY`. Without it every restart signs readers out mid-queue.
- [ ] The `readings` volume in `docker-compose.yml` holds the only durable state
      in the app. Back it up; a rebuild without it discards live orders.
- [ ] Human readings store what a stranger wrote about their own life. The privacy
      policy must say so, name the retention period, and match what the code does.
- [ ] Fill in every `OPERATOR_*` value. The legal pages render anything missing as
      a visible MISSING marker, which is the point — in Germany the Impressum is
      mandatory and its absence is independently actionable, and a marketing email
      without a real postal address breaches CAN-SPAM on its own.
- [ ] Give marketing its own sending domain, separate from the main one, and warm
      it before any volume. The code will not send until it differs from the
      transactional domain.

## Licence note

The card artwork in `cardart.py` was drawn for this project. It is not a
reproduction of the Rider–Waite–Smith deck and carries none of its provenance
questions.
