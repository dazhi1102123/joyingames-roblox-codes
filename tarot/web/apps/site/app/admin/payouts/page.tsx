import type { Metadata } from "next"
import { isOperator } from "@/lib/auth"
import { payoutsOwed } from "@/lib/payouts"
import { settle } from "@/lib/actions"

export const metadata: Metadata = { title: "Payouts", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

export default async function Payouts() {
  if (!(await isOperator())) {
    return (
      <article className="prose-wide">
        <h1>Not authorised</h1>
        <p><a href="/admin">Sign in</a></p>
      </article>
    )
  }

  const owed = payoutsOwed()
  const total = owed.reduce((sum, r) => sum + (r.owed_cents ?? 0), 0)

  return (
    <article className="prose-wide">
      <p className="eyebrow">Operator</p>
      <h1>Payouts</h1>
      <p className="lede">
        The provider settles to one payee and does not split, so what each reader
        is owed is tracked here and paid out of band. The fee is snapshotted per
        order: changing a reader&rsquo;s rate never rewrites what was already
        earned.
      </p>

      {owed.length === 0 ? (
        <p className="note">Nothing owed.</p>
      ) : (
        <>
          <table className="ledger">
            <thead>
              <tr>
                <th>Reader</th>
                <th>Delivered</th>
                <th>Owed</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {owed.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.jobs}</td>
                  <td>€{row.owed}</td>
                  <td>
                    <form action={settle}>
                      <input type="hidden" name="reader_id" value={row.id} />
                      <button className="btn" type="submit">
                        Mark settled
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note">Total owed: €{(total / 100).toFixed(2)}</p>
        </>
      )}
    </article>
  )
}
