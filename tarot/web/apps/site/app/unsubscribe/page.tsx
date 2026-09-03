import type { Metadata } from "next"
import { unsubscribe } from "@/lib/subscribers"

export const metadata: Metadata = {
  title: "Unsubscribed",
  robots: { index: false, follow: false },
}
export const dynamic = "force-dynamic"

/** One click out, no confirmation step.
 *
 * Always reports success: an address that was never on the list is, from the
 * sender's side, exactly as unsubscribed as one that was. Saying "not found"
 * would both leak membership and read as a failure to the person leaving.
 */
export default async function Unsubscribe({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  const { t } = await searchParams
  if (t) unsubscribe(t)

  return (
    <article className="prose-wide">
      <p className="eyebrow">Daily card</p>
      <h1>Removed</h1>
      <p className="lede">
        You will not receive the daily card again. Nothing else was changed, and
        no reply is needed.
      </p>
      <p>
        <a className="btn" href="/">
          Back to the site
        </a>
      </p>
    </article>
  )
}
