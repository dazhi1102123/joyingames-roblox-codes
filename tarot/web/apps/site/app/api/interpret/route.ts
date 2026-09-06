import { NextResponse } from "next/server"
import { SPREADS, cardBySlug } from "@arcana/core"
import { interpreter, violatesRules, type InterpretRequest } from "@/lib/interpreter"

/** Streams a model-written interpretation of a spread the browser already drew.
 *
 * The draw stays client-side, so the pages around this remain static and
 * cacheable — only the interpretation is dynamic. The API key never leaves the
 * server, which is the whole reason this route exists.
 *
 * The question is read, used, and dropped. It is the most sensitive thing on
 * the site: a stranger's account of their own situation. Nothing here logs it,
 * and nothing writes it to the database.
 */
export const dynamic = "force-dynamic"
export const maxDuration = 60

const MAX_QUESTION = 400
const MAX_CONTEXT = 600

/** A crude per-IP limit, in memory.
 *
 * Good enough to stop one browser tab burning the month's budget, and honest
 * about what it is not: a single process's memory, so it resets on deploy and
 * does not span instances. Anything serious belongs in front of the app.
 */
const WINDOW_MS = 60_000
const PER_WINDOW = Number(process.env.AI_RATE_PER_MINUTE ?? "6")
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear() // bound the map rather than leak
  return recent.length > PER_WINDOW
}

function parse(body: unknown): InterpretRequest | string {
  if (!body || typeof body !== "object") return "expected an object"
  const raw = body as Record<string, unknown>

  const spreadSlug = String(raw.spread ?? "")
  const spread = SPREADS[spreadSlug]
  if (!spread) return "unknown spread"

  if (!Array.isArray(raw.drawn)) return "drawn must be an array"
  if (raw.drawn.length !== spread.count) {
    return `${spread.slug} needs ${spread.count} cards`
  }

  const drawn = []
  const seen = new Set<string>()
  for (const entry of raw.drawn) {
    if (!entry || typeof entry !== "object") return "bad card"
    const slug = String((entry as Record<string, unknown>).slug ?? "")
    // A deck cannot deal the same card twice; a body that says otherwise was
    // written by hand, and there is no reason to spend a model call on it.
    if (!cardBySlug(slug) || seen.has(slug)) return "bad card"
    seen.add(slug)
    drawn.push({ slug, reversed: Boolean((entry as Record<string, unknown>).reversed) })
  }

  return {
    spread: spreadSlug,
    drawn,
    question: String(raw.question ?? "").slice(0, MAX_QUESTION),
    context: raw.context ? String(raw.context).slice(0, MAX_CONTEXT) : undefined,
  }
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"

  if (rateLimited(ip)) {
    return NextResponse.json({ error: "slow down" }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  const parsed = parse(body)
  if (typeof parsed === "string") {
    return NextResponse.json({ error: parsed }, { status: 400 })
  }

  const active = interpreter()
  if (active.name === "corpus") {
    // Nothing to add over what the browser already rendered.
    return NextResponse.json({ error: "no model configured" }, { status: 503 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = ""
      try {
        for await (const chunk of active.stream(parsed)) {
          full += chunk
          controller.enqueue(encoder.encode(chunk))
        }
      } catch (error) {
        // The browser is already showing the corpus reading, so the honest
        // failure is to stop rather than to half-replace it with an error.
        console.error("interpretation failed:", (error as Error).message)
        controller.enqueue(encoder.encode("\n\n[[ABORT]]"))
        controller.close()
        return
      }

      // Checked after the fact because the output streams. The client discards
      // everything and keeps the corpus reading when this fires.
      const violation = violatesRules(full)
      if (violation) {
        console.warn(`interpretation rejected, matched: ${violation}`)
        controller.enqueue(encoder.encode("\n\n[[ABORT]]"))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Interpreter": active.name,
    },
  })
}
