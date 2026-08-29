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
  services on separate domains.

The reading engine and content library don't depend on any of those, which is
why they're built first.

---

## Layout

```
app.py           routes, draw mechanics, interpretation, sitemap
tarot_data.py    78 cards, 6 spreads, contexts — the single source of truth
cardart.py       SVG card faces (22 major emblems, 4 suit glyphs, pip layouts)
templates/       Jinja templates
static/          styles.css, app.js (theme), reading.js (the reading stage)
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

## Licence note

The card artwork in `cardart.py` was drawn for this project. It is not a
reproduction of the Rider–Waite–Smith deck and carries none of its provenance
questions.
