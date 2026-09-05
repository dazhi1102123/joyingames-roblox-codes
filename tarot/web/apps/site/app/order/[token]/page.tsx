import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { SPREADS, renderMarkdown } from "@arcana/core"
import { CardFace } from "../../card-face"
import { getOrder } from "@/lib/orders"

/** A private link. Never indexed, never cached. */
export const metadata: Metadata = {
  title: "Your reading",
  robots: { index: false, follow: false },
}
export const dynamic = "force-dynamic"

type Params = { params: Promise<{ token: string }> }

const STATUS_NOTE: Record<string, string> = {
  open: "Waiting for your reader to pick it up.",
  claimed: "Your reader is writing it now.",
  delivered: "Delivered.",
  cancelled: "Cancelled.",
}

export default async function OrderPage({ params }: Params) {
  const { token } = await params
  const order = getOrder(token)
  if (!order) notFound()

  const spread = SPREADS[order.spread_slug]

  return (
    <article className="prose-wide">
      <p className="eyebrow">Your order</p>
      <h1>{order.reader_name}</h1>

      <dl className="facts">
        <div>
          <dt>Status</dt>
          <dd>{STATUS_NOTE[order.status] ?? order.status}</dd>
        </div>
        <div>
          <dt>Payment</dt>
          <dd className="cap">{order.payment_status}</dd>
        </div>
        <div>
          <dt>Spread</dt>
          <dd>{spread?.name ?? order.spread_slug}</dd>
        </div>
        <div>
          <dt>Due</dt>
          <dd>
            {new Date(order.due_at).toLocaleString()}
            {order.overdue && " — overdue"}
          </dd>
        </div>
      </dl>

      {order.payment_status !== "paid" && order.status !== "cancelled" && (
        <aside className="disclaimer">
          <strong>Awaiting payment.</strong> Your reader sees this order once
          payment settles. Nothing is written before then.
        </aside>
      )}

      <h2>Your cards</h2>
      <aside className="provenance">
        <strong>Drawn {new Date(order.created_at).toLocaleString()}</strong>, when you
        placed the order — before any reader saw it. The order below is the order they
        came out of the deck, and it has not changed since. Cards are drawn with a
        cryptographic random number generator, not a seeded shuffle.
      </aside>
      <ol className="spread-grid" data-count={order.drawn.length}>
        {order.drawn.map((entry, i) => (
          <li key={`${entry.slug}-${i}`}>
            <span className="pos">
              <b>{i + 1}</b> {spread?.positions[i]?.name ?? `Card ${i + 1}`}
            </span>
            <CardFace slug={entry.slug} reversed={entry.reversed} />
            <a className="cardname" href={`/cards/${entry.slug}`}>
              {entry.slug.replace(/-/g, " ")}
            </a>
            {entry.reversed && <span className="tag">Reversed</span>}
          </li>
        ))}
      </ol>

      {order.reading ? (
        <section className="interpretation">
          <h2>Your reading</h2>
          {order.reading.split(/\n{2,}/).map((p, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: renderMarkdown(p) }} />
          ))}
        </section>
      ) : (
        <p className="note">
          The reading will appear here. Keep this link — it is the only way back
          to it, and we cannot recover it for you.
        </p>
      )}

      <h2>What you asked</h2>
      <p className="note">{order.situation}</p>
      {order.tried && <p className="note">Already tried: {order.tried}</p>}
    </article>
  )
}
