import type { Metadata } from "next"
import { MyDeck } from "./deck"

export const metadata: Metadata = {
  title: "Your Reading History",
  description:
    "The cards you have drawn on this device, and what keeps coming back. " +
    "Stored in your browser, never sent anywhere.",
  robots: { index: false, follow: true },
}

export default function MyDeckPage() {
  return (
    <article className="prose-wide">
      <p className="eyebrow">Your deck</p>
      <h1>What keeps coming back</h1>
      <p className="lede">
        Every reading you draw on this device is kept in your browser so you can see
        the pattern across them. Nothing is sent to us and no account exists — clearing
        your browser data clears this, and we cannot recover it.
      </p>
      <MyDeck />
    </article>
  )
}
