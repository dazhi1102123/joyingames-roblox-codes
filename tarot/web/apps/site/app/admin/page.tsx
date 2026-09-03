import type { Metadata } from "next"
import { isOperator } from "@/lib/auth"
import { unpaidOrders } from "@/lib/orders"
import { listReaders } from "@/lib/readers"
import { subscriberStats } from "@/lib/subscribers"
import { channelsAreSeparated } from "@/lib/mailer"
import { provider } from "@/lib/payments"
import { markPaid, signInOperator } from "@/lib/actions"

export const metadata: Metadata = { title: "Operator", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

export default async function Admin() {
  if (!(await isOperator())) {
    return (
      <article className="prose-wide">
        <p className="eyebrow">Operator</p>
        <h1>Sign in</h1>
        <form action={signInOperator} className="order-form">
          <label>
            <span className="eyebrow">Admin key</span>
            <input name="key" type="password" autoComplete="off" required />
          </label>
          <button className="btn primary" type="submit">
            Sign in
          </button>
        </form>
        {!process.env.ADMIN_KEY && (
          <aside className="disclaimer">
            <strong>ADMIN_KEY is not set.</strong> Nobody can sign in until it is.
          </aside>
        )}
      </article>
    )
  }

  const pending = unpaidOrders()
  const readers = listReaders(false)
  const subs = subscriberStats()
  const separated = channelsAreSeparated()

  return (
    <article className="prose-wide">
      <p className="eyebrow">Operator</p>
      <h1>Console</h1>

      <dl className="facts">
        <div>
          <dt>Payment provider</dt>
          <dd>{provider().name}</dd>
        </div>
        <div>
          <dt>Mail channels</dt>
          <dd>
            {separated ? (
              "separated"
            ) : (
              <strong className="missing">
                SHARING A DOMAIN — marketing sends are blocked
              </strong>
            )}
          </dd>
        </div>
        <div>
          <dt>Subscribers</dt>
          <dd>
            {subs.confirmed ?? 0} confirmed · {subs.pending ?? 0} pending
          </dd>
        </div>
      </dl>

      <h2>Awaiting payment</h2>
      {pending.length === 0 ? (
        <p className="note">Nothing outstanding.</p>
      ) : (
        <table className="ledger">
          <thead>
            <tr>
              <th>Reader</th>
              <th>Created</th>
              <th>Price</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pending.map((order) => (
              <tr key={order.token}>
                <td>{order.reader_name}</td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>€{order.price}</td>
                <td className="cap">{order.payment_status}</td>
                <td>
                  <form action={markPaid}>
                    <input type="hidden" name="token" value={order.token} />
                    <button className="btn" type="submit">
                      Mark paid
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Readers</h2>
      <table className="ledger">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Reader keeps</th>
            <th>Margin</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {readers.map((r) => (
            <tr key={r.slug}>
              <td>{r.name}</td>
              <td>€{r.price}</td>
              <td>€{r.payout}</td>
              <td>€{r.margin}</td>
              <td>{r.active ? "yes" : "no"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        <a className="btn" href="/admin/payouts">
          Payout ledger →
        </a>
      </p>
    </article>
  )
}
