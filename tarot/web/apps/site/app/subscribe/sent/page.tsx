import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Check your inbox",
  robots: { index: false, follow: false },
}

export default function Sent() {
  return (
    <article className="prose-wide">
      <p className="eyebrow">Daily card</p>
      <h1>Check your inbox</h1>
      <p className="lede">
        We sent one message with a confirmation link. Nothing else will arrive
        until you click it — that is what double opt-in means, and it is why this
        list stays out of spam folders.
      </p>
    </article>
  )
}
