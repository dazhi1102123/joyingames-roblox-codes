import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { CONTEXTS, SPREADS } from "@arcana/core"
import { getReader, readerLoad } from "@/lib/readers"
import { placeOrder } from "@/lib/actions"
import { canonical } from "@/lib/site"

export const revalidate = 60

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const reader = getReader(slug)
  if (!reader) return {}
  return {
    title: `Order a reading from ${reader.name}`,
    description: `${reader.tagline} €${reader.price}, written by hand and delivered within ${reader.turnaround_h} hours.`,
    alternates: { canonical: canonical(`/readers/${reader.slug}`) },
  }
}

export default async function ReaderPage({ params }: Params) {
  const { slug } = await params
  const reader = getReader(slug)
  if (!reader || !reader.active) notFound()

  const full = readerLoad(reader.id) >= reader.capacity

  return (
    <article className="prose-wide">
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/readers">Readers</a> / <span>{reader.name}</span>
      </nav>

      <h1>{reader.name}</h1>
      <p className="lede">{reader.tagline}</p>
      <p>{reader.bio}</p>
      {reader.approach && (
        <>
          <h2 className="label">How they work</h2>
          <p>{reader.approach}</p>
        </>
      )}

      <dl className="facts">
        <div>
          <dt>Price</dt>
          <dd>
            €{reader.price} {reader.currency}
          </dd>
        </div>
        <div>
          <dt>Turnaround</dt>
          <dd>within {reader.turnaround_h} hours</dd>
        </div>
      </dl>

      {full ? (
        <aside className="disclaimer">
          <strong>Fully booked.</strong> {reader.name} is at capacity right now.
          Capacity is a real limit, not a scarcity tactic — a reader holding
          twenty orders writes twenty worse readings.
        </aside>
      ) : (
        <form action={placeOrder} className="order-form">
          <input type="hidden" name="reader" value={reader.slug} />

          <label>
            <span className="eyebrow">What is this about?</span>
            <select name="focus" defaultValue="general">
              {CONTEXTS.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="eyebrow">The situation *</span>
            <textarea
              name="situation"
              rows={7}
              required
              minLength={20}
              maxLength={4000}
              placeholder="What is going on, and what do you want to understand about it? The more specific you are, the less generic the reading."
            />
          </label>

          <label>
            <span className="eyebrow">What have you already tried?</span>
            <textarea
              name="tried"
              rows={3}
              maxLength={4000}
              placeholder="Optional — it stops the reader suggesting something you have already ruled out."
            />
          </label>

          <label>
            <span className="eyebrow">Spread</span>
            <select name="spread" defaultValue="situation">
              {Object.values(SPREADS).map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name} — {s.count} card{s.count > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="eyebrow">Birth date (optional)</span>
            <input type="date" name="birth" />
          </label>

          <button className="btn primary" type="submit">
            Continue to payment — €{reader.price}
          </button>

          <p className="note">
            No account is created. The reading arrives at a private link that only
            you have. We store what you type here and delete it after 90 days.
          </p>
        </form>
      )}
    </article>
  )
}
