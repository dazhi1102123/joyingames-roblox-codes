import type { Metadata } from "next"
import { listReaders } from "@/lib/readers"
import { readerLoad } from "@/lib/readers"

export const metadata: Metadata = {
  title: "Readings by a Person",
  description:
    "Order a written tarot reading from a real reader. You describe the " +
    "situation, they write it by hand and send it back within the stated time.",
  alternates: { canonical: "/readers" },
}

// Reader availability changes as orders come in, so this cannot be baked at
// build time. Revalidating rather than going fully dynamic keeps it cacheable.
export const revalidate = 60

export default function Readers() {
  const readers = listReaders()

  return (
    <article className="prose-wide">
      <p className="eyebrow">Readings by a person</p>
      <h1>When you want a human to read it</h1>
      <p className="lede">
        The free readings on this site are generated from the card corpus. These
        are not: you describe the situation, a reader writes the reading by hand
        and sends it back. No subscription, no upsell, one price.
      </p>

      {readers.length === 0 ? (
        <p className="note">
          No readers are taking orders at the moment. The free spreads are always
          open.
        </p>
      ) : (
        <div className="grid three">
          {readers.map((reader) => {
            const load = readerLoad(reader.id)
            const full = load >= reader.capacity
            return (
              <article key={reader.slug} className="tile reader">
                <h3>{reader.name}</h3>
                <p className="note">{reader.tagline}</p>
                <p>{reader.bio}</p>
                {reader.specialties.length > 0 && (
                  <ul className="keys">
                    {reader.specialties.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                )}
                <footer>
                  <span>
                    €{reader.price} · {reader.turnaround_h}h
                  </span>
                  {full ? (
                    <span className="count">Fully booked</span>
                  ) : (
                    <a className="count" href={`/readers/${reader.slug}`}>
                      Order →
                    </a>
                  )}
                </footer>
              </article>
            )
          })}
        </div>
      )}

      <aside className="disclaimer">
        <strong>What you get.</strong> A written reading, delivered to a private
        link only you have. Readers are subcontracted by the site; the site is the
        seller and issues the receipt. A reading that has not been started can be
        cancelled for a full refund.
      </aside>
    </article>
  )
}
