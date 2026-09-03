import type { Metadata } from "next"
import { confirmSubscriber } from "@/lib/subscribers"
import { clientIp } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Confirmed",
  robots: { index: false, follow: false },
}
export const dynamic = "force-dynamic"

export default async function Confirm({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  const { t } = await searchParams
  const sub = t ? confirmSubscriber(t, await clientIp()) : null

  return (
    <article className="prose-wide">
      <p className="eyebrow">Daily card</p>
      <h1>{sub ? "You are in." : "That link did not work"}</h1>
      {sub ? (
        <p className="lede">
          One card a day, with what to watch for. Every message has a one-click
          unsubscribe — no login, no &ldquo;are you sure&rdquo;.
        </p>
      ) : (
        <p className="lede">
          The link may have expired, or the address may already have been removed.
          Nothing has been sent.
        </p>
      )}
    </article>
  )
}
