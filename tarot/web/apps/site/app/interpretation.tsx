"use client"

import { useEffect, useRef, useState } from "react"
import { renderMarkdown, type Reading } from "@arcana/core"

/** The reading, with a model pass layered over it when one is configured.
 *
 * The corpus reading renders immediately and is never blanked. If a model
 * answers, its text replaces the passages in place; if it fails, is rate
 * limited, is not configured, or produces something the server rejects, what
 * stays on screen is the reading that was already there.
 *
 * That ordering is the point: the visitor never waits on a model, and never
 * sees an error where a reading should be.
 */
export function Interpretation({
  reading,
  context,
}: {
  reading: Reading
  context?: string
}) {
  const [written, setWritten] = useState("")
  const [state, setState] = useState<"corpus" | "writing" | "written">("corpus")
  const abort = useRef<AbortController | null>(null)

  useEffect(() => {
    // A new draw invalidates whatever the model was writing about the old one.
    abort.current?.abort()
    setWritten("")
    setState("corpus")

    const controller = new AbortController()
    abort.current = controller
    let cancelled = false

    async function interpret() {
      let response: Response
      try {
        response = await fetch("/api/interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            spread: reading.spread.slug,
            drawn: reading.cards.map((c) => ({
              slug: c.card.slug,
              reversed: c.reversed,
            })),
            question: reading.question,
            context,
          }),
        })
      } catch {
        return // offline, aborted, or blocked — the corpus reading stands
      }

      // 503 means no model is configured, which is the ordinary case, not an
      // error worth showing anyone.
      if (!response.ok || !response.body) return

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (!cancelled) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // The server appends this when it aborts or rejects its own output.
        if (buffer.includes("[[ABORT]]")) {
          setWritten("")
          setState("corpus")
          return
        }
        setWritten(buffer)
        setState("writing")
      }

      if (!cancelled && buffer.trim()) setState("written")
    }

    interpret()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [reading, context])

  const paragraphs =
    state === "corpus"
      ? reading.passages
      : written.split(/\n{2,}/).filter((p) => p.trim())

  return (
    <section className="interpretation">
      <h2>
        The reading
        {state === "writing" && <span className="writing"> · writing…</span>}
      </h2>
      {paragraphs.map((p, i) => (
        <p key={i} dangerouslySetInnerHTML={{ __html: renderMarkdown(p) }} />
      ))}
      {state === "written" && (
        <p className="note">
          Written for your question against the cards above. The card meanings
          are the site&rsquo;s own; the wording is not.
        </p>
      )}
    </section>
  )
}
