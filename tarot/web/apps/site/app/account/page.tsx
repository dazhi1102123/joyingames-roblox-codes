import type { Metadata } from "next"
import { currentAccount } from "@/lib/auth"
import { ordersForAccount } from "@/lib/orders"
import { requestSignInLink, signOutAccount } from "@/lib/actions"

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
}
export const dynamic = "force-dynamic"

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>
}) {
  const params = await searchParams
  const account = await currentAccount()

  if (!account) {
    return (
      <article className="prose-wide">
        <p className="eyebrow">Account</p>
        <h1>Sign in</h1>
        <p className="lede">
          An account keeps your readings together in one place. It is optional:
          every reading you have ordered stays reachable from the link you were
          given, signed in or not.
        </p>

        {params.error && <aside className="disclaimer">{params.error}</aside>}

        {params.sent ? (
          <aside className="disclaimer">
            <strong>Check your email.</strong> If that address can receive mail
            from us, a sign-in link is on its way. It works once and stops
            working after fifteen minutes.
          </aside>
        ) : (
          <form action={requestSignInLink} className="order-form">
            <label>
              <span className="eyebrow">Email</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <button className="btn primary" type="submit">
              Email me a link
            </button>
          </form>
        )}

        <p className="note">
          There is no password. Nothing behind an account is worth more than the
          mailbox it is addressed to, so a password would only be one more thing
          to lose.
        </p>
      </article>
    )
  }

  const orders = ordersForAccount(account.id)

  return (
    <article className="prose-wide">
      <p className="eyebrow">Account</p>
      <h1>{account.email}</h1>

      <h2>Your readings</h2>
      {orders.length === 0 ? (
        <p className="note">
          Nothing ordered from this account yet. Readings you ordered before
          signing in are not listed here — open them with the link you were
          given.
        </p>
      ) : (
        <table className="ledger">
          <thead>
            <tr>
              <th>Reader</th>
              <th>Ordered</th>
              <th>Price</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.token}>
                <td>{order.reader_name}</td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>€{order.price}</td>
                <td className="cap">
                  {order.status === "delivered" ? "delivered" : order.payment_status}
                </td>
                <td>
                  <a className="btn" href={`/order/${order.token}`}>
                    Open
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form action={signOutAccount}>
        <button className="btn" type="submit">
          Sign out
        </button>
      </form>
    </article>
  )
}
