# Arcana Press

An online tarot site: a reading engine and a programmatic content library, in one
small Flask app with no database and no external services required to run.

```bash
cp .env.example .env
docker compose up -d --build
open http://localhost:5000
```

That's the whole setup. No API key needed — see *Interpretation* below.

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

### Payment is not wired, and that is not an oversight

Paying a person for a psychic reading is the exact category Stripe restricts —
the physical-goods route that works for a bracelet does not cover it, and a
platform that collects and forwards money on a reader's behalf raises payment-
institution questions on top. So the order carries a price and settlement happens
out of band. Two ways out, both a decision rather than code:

- **Directory model.** Readers are paid directly and the site charges them for
  the listing. The site never processes a reading payment. Simplest, and it keeps
  the restricted category out of your merchant account entirely.
- **High-risk acquirer.** The site collects and pays out. Higher ARPU and far more
  compliance surface, including money-flow rules that vary by jurisdiction.

Set `HUMAN_READINGS=0` to hide the whole feature until that is settled.

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

## Licence note

The card artwork in `cardart.py` was drawn for this project. It is not a
reproduction of the Rider–Waite–Smith deck and carries none of its provenance
questions.
