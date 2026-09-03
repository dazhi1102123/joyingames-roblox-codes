import type { Metadata } from "next"
import { ReportTool } from "./tool"

export const metadata: Metadata = {
  title: "Get a Written Tarot Report",
  description:
    "Answer four questions and get a full written tarot report: a spread drawn " +
    "for your situation, read position by position, with your card's colour and " +
    "stone.",
  alternates: { canonical: "/report" },
}

export default function Report() {
  return (
    <article className="prose-wide">
      <p className="eyebrow">Written report</p>
      <h1>Tell it what the situation is first</h1>
      <p className="lede">
        The free spreads answer a question you already know how to ask. This one asks
        first — four questions, then a spread chosen for what you said, read position
        by position.
      </p>
      <ReportTool />
    </article>
  )
}
