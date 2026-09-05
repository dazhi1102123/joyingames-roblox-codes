import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SPREADS } from "@arcana/core"
import { QUESTIONS, QUESTIONS_BY_SLUG, relatedQuestions } from "@/lib/questions"
import { canonical } from "@/lib/site"
import { QuestionReading } from "./reading"

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return QUESTIONS.map((q) => ({ slug: q.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const question = QUESTIONS_BY_SLUG.get(slug)
  if (!question) return {}
  const spread = SPREADS[question.spread]
  return {
    title: question.title,
    description:
      `${question.reframe.slice(0, 150)}… A ${spread.name.toLowerCase()} drawn for ` +
      `this question, read position by position.`,
    alternates: { canonical: canonical(`/questions/${slug}`) },
    openGraph: {
      title: question.title,
      description: question.intro.slice(0, 200),
      url: canonical(`/questions/${slug}`),
    },
  }
}

export default async function QuestionPage({ params }: Params) {
  const { slug } = await params
  const question = QUESTIONS_BY_SLUG.get(slug)
  if (!question) notFound()

  const spread = SPREADS[question.spread]
  const related = relatedQuestions(question)

  // FAQPage is the schema that earns the rich result for a question phrased
  // exactly as people search it — which is what these pages are for.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: question.title,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${question.intro} ${question.reframe} ${question.honest}`,
        },
      },
    ],
  }

  return (
    <article className="reading-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <a href="/questions">By question</a> /{" "}
        <span>{question.title}</span>
      </nav>

      <p className="eyebrow">
        {spread.name} · {spread.count} card{spread.count > 1 ? "s" : ""}
      </p>
      <h1>{question.heading}</h1>

      <p className="lede">{question.intro}</p>
      <p>{question.reframe}</p>

      <aside className="honest">
        <strong>What this cannot do.</strong> {question.honest}
      </aside>

      <QuestionReading spread={spread} lens={question.lens} />

      <section className="explainer">
        <h2>What the positions mean here</h2>
        <dl className="positions">
          {spread.positions.map((p) => (
            <div key={p.name}>
              <dt>{p.name}</dt>
              <dd>{p.note}</dd>
            </div>
          ))}
        </dl>
      </section>

      {question.human && (
        <aside className="cta">
          <p>
            This is a question people often want a person for. A reader will write it
            by hand, against what you actually tell them, and send it back within the
            stated time.
          </p>
          <a className="btn primary" href="/readers">
            Order from a reader
          </a>
        </aside>
      )}

      <section>
        <h2>Other questions</h2>
        <ul className="question-list">
          {related.map((q) => (
            <li key={q.slug}>
              <a href={`/questions/${q.slug}`}>{q.title}</a>
              <span className="mono">{SPREADS[q.spread].name}</span>
            </li>
          ))}
        </ul>
      </section>

      <aside className="disclaimer">
        <strong>For entertainment and reflection.</strong> A tarot reading is a
        structured way of looking at a situation you are already in — it is not
        advice, and it does not predict what will happen. For anything medical, legal
        or financial, talk to someone qualified.
      </aside>
    </article>
  )
}
