import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SPREADS, spreadBySlug } from "@arcana/core"
import { ReadingBoard } from "./board"
import { canonical } from "@/lib/site"

type Params = { params: Promise<{ spread: string }> }

export function generateStaticParams() {
  return Object.keys(SPREADS).map((spread) => ({ spread }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { spread: slug } = await params
  const spread = spreadBySlug(slug)
  if (!spread) return {}
  return {
    title: `${spread.name} Tarot Reading — Free`,
    description: `${spread.blurb} ${spread.count} cards, read by position, with a synthesis of the whole spread.`,
    alternates: { canonical: canonical(`/reading/${spread.slug}`) },
  }
}

export default async function ReadingPage({ params }: Params) {
  const { spread: slug } = await params
  const spread = spreadBySlug(slug)
  if (!spread) notFound()

  // The shell is static and crawlable; only the draw is client-side, because
  // a reading has to be different for every visitor and must never be cached.
  return (
    <article className="reading-page">
      <p className="eyebrow">{spread.count} cards</p>
      <h1>{spread.name}</h1>
      <p className="lede">{spread.blurb}</p>

      <ReadingBoard spread={spread} />

      <section className="explainer">
        <h2>What the positions mean</h2>
        <dl className="positions">
          {spread.positions.map((p) => (
            <div key={p.name}>
              <dt>{p.name}</dt>
              <dd>{p.note}</dd>
            </div>
          ))}
        </dl>
      </section>

      <aside className="disclaimer">
        <strong>For entertainment and reflection.</strong> A tarot reading is a
        structured way of looking at a situation you are already in — it is not
        advice, and it does not predict what will happen. For anything medical,
        legal or financial, talk to someone qualified.
      </aside>
    </article>
  )
}
