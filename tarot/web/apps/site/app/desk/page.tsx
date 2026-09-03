import type { Metadata } from "next"
import { SPREADS } from "@arcana/core"
import { CardFace } from "../card-face"
import { currentReader } from "@/lib/auth"
import { ordersForReader } from "@/lib/orders"
import { readerEarnings } from "@/lib/payouts"
import { claimOrder, deliverOrder, releaseOrder, signInReader, signOutReader } from "@/lib/actions"

export const metadata: Metadata = { title: "Desk", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

export default async function Desk() {
  const reader = await currentReader()

  if (!reader) {
    return (
      <article className="prose-wide">
        <p className="eyebrow">Reader</p>
        <h1>Desk</h1>
        <p className="lede">
          Sign in with the key you were issued. There is no password to forget and
          none to reuse somewhere else.
        </p>
        <form action={signInReader} className="order-form">
          <label>
            <span className="eyebrow">Access key</span>
            <input name="key" type="password" autoComplete="off" required />
          </label>
          <button className="btn primary" type="submit">
            Open the desk
          </button>
        </form>
      </article>
    )
  }

  const queue = ordersForReader(reader.id)
  const earnings = readerEarnings(reader.id)

  return (
    <article className="prose-wide">
      <p className="eyebrow">Desk</p>
      <h1>{reader.name}</h1>

      <dl className="facts">
        <div>
          <dt>Delivered</dt>
          <dd>{earnings.delivered}</dd>
        </div>
        <div>
          <dt>Owed to you</dt>
          <dd>€{earnings.owed}</dd>
        </div>
        <div>
          <dt>Paid out</dt>
          <dd>€{earnings.paid}</dd>
        </div>
        <div>
          <dt>Per reading</dt>
          <dd>€{reader.payout}</dd>
        </div>
      </dl>

      <h2>Queue</h2>
      {queue.length === 0 ? (
        <p className="note">
          Nothing waiting. Unpaid orders are not shown here — you should never
          spend an hour on a reading that was not paid for.
        </p>
      ) : (
        queue.map((order) => {
          const spread = SPREADS[order.spread_slug]
          return (
            <section key={order.token} className="job">
              <header>
                <h3>
                  {spread?.name ?? order.spread_slug} · {order.focus}
                </h3>
                <span className={order.overdue ? "tag" : "note"}>
                  due {new Date(order.due_at).toLocaleString()}
                  {order.overdue && " — overdue"}
                </span>
              </header>

              <p>{order.situation}</p>
              {order.tried && <p className="note">Already tried: {order.tried}</p>}

              <ol className="spread-grid" data-count={order.drawn.length}>
                {order.drawn.map((entry, i) => (
                  <li key={`${entry.slug}-${i}`}>
                    <span className="pos">
                      {spread?.positions[i]?.name ?? `Card ${i + 1}`}
                    </span>
                    <CardFace slug={entry.slug} reversed={entry.reversed} />
                    <span className="cardname">{entry.slug.replace(/-/g, " ")}</span>
                  </li>
                ))}
              </ol>

              {order.status === "open" ? (
                <form action={claimOrder}>
                  <input type="hidden" name="token" value={order.token} />
                  <button className="btn primary" type="submit">
                    Claim this one
                  </button>
                </form>
              ) : (
                <>
                  <form action={deliverOrder} className="order-form">
                    <input type="hidden" name="token" value={order.token} />
                    <label>
                      <span className="eyebrow">The reading</span>
                      <textarea
                        name="reading"
                        rows={14}
                        required
                        placeholder="One paragraph per position, then what the spread says as a whole. **Bold** opens each paragraph."
                      />
                    </label>
                    <button className="btn primary" type="submit">
                      Deliver
                    </button>
                  </form>
                  <form action={releaseOrder}>
                    <input type="hidden" name="token" value={order.token} />
                    <button className="btn" type="submit">
                      Put it back in the queue
                    </button>
                  </form>
                </>
              )}
            </section>
          )
        })
      )}

      <form action={signOutReader}>
        <button className="btn" type="submit">
          Sign out
        </button>
      </form>
    </article>
  )
}
