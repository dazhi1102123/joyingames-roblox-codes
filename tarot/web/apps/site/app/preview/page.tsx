import type { Metadata } from "next"
import { CARDS, SPREADS, CONTEXTS } from "@arcana/core"
import { listReaders } from "@/lib/readers"
import { db } from "@/lib/db"

/** Every route in one place, for looking the site over.
 *
 * Not part of the product: noindex, and disallowed in robots.txt. It exists
 * because reviewing a 99-page site by typing URLs is miserable, and because a
 * link to a *seeded* order is the only way to see a delivered reading without
 * first hunting the token out of the database.
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

  return (
    <article className="prose-wide">
      <p className="eyebrow">Not a public page</p>
      <h1>Every page, in one list</h1>
      <p className="lede">
        {CARDS.length + Object.keys(SPREADS).length + 10} routes. This page is
        noindex and disallowed in robots.txt — it is here so the site can be
        reviewed by clicking rather than by typing URLs.
      </p>

      <Group
        title="Main"
        links={[
          { href: "/", label: "Home" },
          { href: "/cards", label: "The deck — all 78" },
          { href: "/spreads", label: "Spreads explained" },
          { href: "/readers", label: "Readings by a person" },
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
          { href: "/sitemap.xml", label: "sitemap.xml", hint: "91 URLs" },
          { href: "/robots.txt", label: "robots.txt" },
        ]}
      />
    </article>
  )
}
