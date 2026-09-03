import type { Metadata } from "next"
import {
  CARDS,
  CONTEXTS,
  SPREADS,
  allDateSlugs,
  drawCards,
  encodeReading,
} from "@arcana/core"
import { comboPairs, comboScope } from "@/lib/pages"
import { listReaders } from "@/lib/readers"
import { db } from "@/lib/db"

/** Every route in one place, for looking the site over.
 *
 * Not part of the product: noindex, and disallowed in robots.txt. It exists
 * because reviewing a 1,250-page site by typing URLs is miserable, and because
 * a link to a *seeded* order is the only way to see a delivered reading
 * without first hunting the token out of the database.
 *
 * Every count here is computed from the corpus rather than written down. The
 * previous version said "91 URLs" long after there were 1,237, which is what
 * a hand-maintained index of a generated site always becomes.
 */
export const metadata: Metadata = {
  title: "All pages",
  robots: { index: false, follow: false },
}
export const dynamic = "force-dynamic"

function Group({
  title,
  note,
  links,
}: {
  title: string
  note?: string
  links: Array<{ href: string; label: string; hint?: string }>
}) {
  return (
    <section className="preview-group">
      <h2>{title}</h2>
      {note && <p className="note">{note}</p>}
      <ul className="preview-list">
        {links.map((l) => (
          <li key={l.href}>
            <a href={l.href}>{l.label}</a>
            <code>{l.href}</code>
            {l.hint && <span className="note">{l.hint}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Preview() {
  const readers = listReaders(false)

  const orders = db()
    .prepare(
      `SELECT o.token, o.status, o.payment_status, r.name
       FROM orders o JOIN readers r ON r.id = o.reader_id
       ORDER BY o.id DESC LIMIT 6`,
    )
    .all() as Array<{ token: string; status: string; payment_status: string; name: string }>

  const pending = db()
    .prepare("SELECT token, email FROM subscribers WHERE status = 'pending' LIMIT 1")
    .get() as { token: string; email: string } | undefined

  const confirmed = db()
    .prepare("SELECT token, email FROM subscribers WHERE status = 'confirmed' LIMIT 1")
    .get() as { token: string; email: string } | undefined

  const contextPages = CARDS.reduce(
    (sum, c) => sum + CONTEXTS.filter((x) => x.slug !== "general" && c.ctx[x.slug]).length,
    0,
  )
  const total =
    9 +                              // main, report, daily, learn, birth-card, my-deck, spreads, readers, preview
    Object.keys(SPREADS).length +
    CARDS.length +
    contextPages +
    (CONTEXTS.length - 1) +          // context hubs
    comboPairs().length +
    allDateSlugs().length +
    4                                // legal
  const sampleCode = encodeReading("three-card", drawCards(3, true))

  return (
    <article className="prose-wide">
      <p className="eyebrow">Not a public page</p>
      <h1>Every page, in one list</h1>
      <p className="lede">
        {total.toLocaleString()} pages. This page is noindex and disallowed in
        robots.txt — it is here so the site can be reviewed by clicking rather
        than by typing URLs.
      </p>

      <dl className="facts">
        <div>
          <dt>Card pages</dt>
          <dd>{CARDS.length} general + {contextPages} by context</dd>
        </div>
        <div>
          <dt>Combination pages</dt>
          <dd>
            {comboPairs().length.toLocaleString()} published ·{" "}
            {(CARDS.length * (CARDS.length - 1)).toLocaleString()} possible
          </dd>
        </div>
        <div>
          <dt>Combination scope</dt>
          <dd>
            <code>COMBO_SITEMAP_SCOPE={comboScope()}</code>
          </dd>
        </div>
        <div>
          <dt>Birth date pages</dt>
          <dd>{allDateSlugs().length}</dd>
        </div>
      </dl>

      <Group
        title="Main"
        links={[
          { href: "/", label: "Home" },
          { href: "/cards", label: "The deck — all 78" },
          { href: "/spreads", label: "Spreads explained" },
          { href: "/learn", label: "How to read tarot" },
          { href: "/report", label: "Written report", hint: "intake → report, all in-browser" },
          { href: "/daily", label: "Card of the day", hint: "same card for everyone" },
          { href: "/birth-card", label: "Find your birth card" },
          { href: "/my-deck", label: "Your reading history", hint: "localStorage" },
          { href: "/readers", label: "Readings by a person" },
        ]}
      />

      <Group
        title="By question"
        note="The context hubs the footer links to. Yes-or-no has its own shape — cards carry a lean, not a paragraph."
        links={CONTEXTS.filter((c) => c.slug !== "general").map((c) => ({
          href: `/cards/context/${c.slug}`,
          label: c.label,
        }))}
      />

      <Group
        title="A card, by context"
        note={`${contextPages} pages. The same card answers a different question on each — this is what the site is found by.`}
        links={CONTEXTS.filter((c) => c.slug !== "general" && CARDS[16].ctx[c.slug]).map(
          (c) => ({
            href: `/cards/the-tower/${c.slug}`,
            label: `The Tower — ${c.label}`,
          }),
        )}
      />

      <Group
        title="Combinations"
        note={`${comboPairs().length} published of ${(CARDS.length * (CARDS.length - 1)).toLocaleString()} possible. Staged on purpose: six thousand thin pages at once is how a new domain loses its crawl budget.`}
        links={[
          { href: "/combinations/the-tower/the-star", label: "The Tower + The Star" },
          { href: "/combinations/the-fool/the-world", label: "The Fool + The World" },
          { href: "/combinations/death/temperance", label: "Death + Temperance" },
        ]}
      />

      <Group
        title="Birth dates"
        note={`${allDateSlugs().length} pages, one per calendar date, 29 February included.`}
        links={[
          { href: "/birth-card/april-3", label: "Born on April 3" },
          { href: "/birth-card/february-29", label: "Born on February 29", hint: "leap day" },
          { href: "/birth-card/december-25", label: "Born on December 25" },
        ]}
      />

      <Group
        title="Shared reading"
        note="The whole reading travels in the URL. Nothing is stored, so the link cannot be revoked and there is nothing to leak."
        links={[
          { href: `/r/${sampleCode}`, label: "A shared three-card reading", hint: `${sampleCode.length} characters` },
          { href: "/r/not-a-real-code", label: "A malformed code", hint: "should 404, not error" },
        ]}
      />

      <Group
        title="Readings"
        note="A draw happens in your browser, so every reload is a different spread."
        links={Object.values(SPREADS).map((s) => ({
          href: `/reading/${s.slug}`,
          label: s.name,
          hint: `${s.count} card${s.count > 1 ? "s" : ""}`,
        }))}
      />

      <Group
        title="Cards — a sample"
        note={`All ${CARDS.length} have their own page with ${CONTEXTS.length} contexts. A few worth opening:`}
        links={[
          "the-fool",
          "the-star",
          "the-tower",
          "the-moon",
          "death",
          "ace-of-cups",
          "seven-of-swords",
          "king-of-pentacles",
        ].map((slug) => ({
          href: `/cards/${slug}`,
          label: CARDS.find((c) => c.slug === slug)?.name ?? slug,
        }))}
      />

      <Group
        title="Ordering from a person"
        note="Reader pages carry the order form. Capacity is real — a fully booked reader hides the form."
        links={readers.map((r) => ({
          href: `/readers/${r.slug}`,
          label: r.name,
          hint: `€${r.price} · ${r.active ? "active" : "inactive"}`,
        }))}
      />

      {orders.length > 0 && (
        <Group
          title="Seeded orders"
          note="Private links. In real use these only ever reach the person who ordered."
          links={orders.map((o) => ({
            href: `/order/${o.token}`,
            label: `${o.name} — ${o.status}`,
            hint: o.payment_status,
          }))}
        />
      )}

      <Group
        title="Consoles"
        note="Both want a key. The reader keys are printed by the seed step; the operator key is your ADMIN_KEY."
        links={[
          { href: "/desk", label: "Reader's desk" },
          { href: "/admin", label: "Operator console" },
          { href: "/admin/payouts", label: "Payout ledger" },
        ]}
      />

      <Group
        title="Mailing list"
        links={[
          ...(pending
            ? [{
                href: `/subscribe/confirm?t=${pending.token}`,
                label: "Confirm a pending subscription",
                hint: pending.email,
              }]
            : []),
          ...(confirmed
            ? [{
                href: `/unsubscribe?t=${confirmed.token}`,
                label: "One-click unsubscribe",
                hint: `${confirmed.email} — this really removes them`,
              }]
            : []),
          { href: "/subscribe/sent", label: "Check-your-inbox page" },
        ]}
      />

      <Group
        title="Legal"
        note="Red MISSING markers on the Impressum and Privacy pages are the operator fields still owed."
        links={[
          { href: "/legal/impressum", label: "Impressum", hint: "§5 DDG" },
          { href: "/legal/privacy", label: "Privacy" },
          { href: "/legal/terms", label: "Terms of use" },
          { href: "/legal/disclaimer", label: "Disclaimer" },
        ]}
      />

      <Group
        title="Machine-readable"
        links={[
          { href: "/sitemap.xml", label: "sitemap.xml", hint: "index" },
          { href: "/sitemap/0.xml", label: "sitemap/0.xml", hint: "the URLs themselves" },
          { href: "/healthz", label: "healthz", hint: "asserts the corpus loaded" },
          { href: "/robots.txt", label: "robots.txt" },
        ]}
      />
    </article>
  )
}
