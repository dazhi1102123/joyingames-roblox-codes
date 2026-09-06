import type { Metadata } from "next"
import { isOperator } from "@/lib/auth"
import { listAccounts } from "@/lib/accounts"
import { setAccountStatusAction } from "@/lib/actions"

export const metadata: Metadata = {
  title: "Accounts",
  robots: { index: false, follow: false },
}
export const dynamic = "force-dynamic"

export default async function Accounts() {
  if (!(await isOperator())) {
    return (
      <article className="prose-wide">
        <p className="eyebrow">Operator</p>
        <h1>Not signed in</h1>
        <p>
          <a className="btn primary" href="/admin">
            Sign in
          </a>
        </p>
      </article>
    )
  }

  const accounts = listAccounts()

  return (
    <article className="prose-wide">
      <p className="eyebrow">Operator</p>
      <h1>Accounts</h1>
      <p className="lede">
        Banning ends every session that account holds, immediately — a session
        cookie is re-checked against this list on every request rather than
        trusted for its full sixty days.
      </p>

      {accounts.length === 0 ? (
        <p className="note">Nobody has signed in yet.</p>
      ) : (
        <table className="ledger">
          <thead>
            <tr>
              <th>Email</th>
              <th>Joined</th>
              <th>Last seen</th>
              <th>Orders</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.email}</td>
                <td>{new Date(a.created_at).toLocaleDateString()}</td>
                <td>
                  {a.last_seen_at ? new Date(a.last_seen_at).toLocaleDateString() : "—"}
                </td>
                <td>{a.orders}</td>
                <td className="cap">{a.status}</td>
                <td>
                  <form action={setAccountStatusAction}>
                    <input type="hidden" name="account_id" value={a.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={a.status === "banned" ? "active" : "banned"}
                    />
                    <button className="btn" type="submit">
                      {a.status === "banned" ? "Restore" : "Ban"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p>
        <a className="btn" href="/admin">
          ← Console
        </a>
      </p>
    </article>
  )
}
