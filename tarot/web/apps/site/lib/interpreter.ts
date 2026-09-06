import "server-only"

import { SPREADS, composeReading, hydrate, type DrawSpec, type Reading } from "@arcana/core"

/** Model-written interpretations, behind one interface.
 *
 * The corpus already produces a complete reading. A model is not here to
 * replace it -- it is here to do the one thing the corpus cannot: speak to the
 * specific question someone typed. So the corpus reading is composed first and
 * handed to the model as material, and it is also what renders when there is
 * no key, no budget, or no response.
 *
 * That makes the no-model path complete rather than degraded, the same posture
 * as the `manual` payment provider and the `console` mailer.
 *
 * Handing the model the card meanings rather than only the card names bounds
 * the failure mode: it can phrase The Tower badly, but it cannot decide The
 * Tower means good luck.
 */

export type Provider = "corpus" | "claude" | "openai"

export interface InterpretRequest {
  spread: string
  drawn: DrawSpec[]
  /** What the visitor typed. Never stored -- see the route handler. */
  question: string
  /** The page's own framing, so the model answers the question the page asked. */
  context?: string
}

/** The rules the output has to stay inside.
 *
 * These are not decoration. A model interpretation is the operator's own
 * speech, so anything it asserts is the operator asserting it -- a prediction
 * about someone's health or a claim about another person's feelings is a
 * liability, not a stylistic lapse.
 */
const SYSTEM = `You write tarot readings for Arcana Press.

You are given a spread that has already been drawn, the meaning of each card in
its position from the site's own corpus, and the visitor's question. Rewrite the
reading so it answers that question specifically. Keep the site's voice: direct,
concrete, unsentimental, willing to say the uncomfortable thing.

Hard rules, in order of importance:

1. Never predict an event or an outcome. You describe a situation the person is
   already in. "This suggests" and "where this is heading on current terms" are
   fine; "you will" is not.
2. Never claim to know what another person thinks or feels. You can describe the
   space between two people. You cannot report someone's mind.
3. Never give medical, legal, financial or psychological advice, and never
   suggest a card indicates a diagnosis, a legal outcome, or a return on money.
   If the question is really one of those, say so and suggest a qualified person.
4. Use only the card meanings supplied. Do not invent a meaning, do not add
   cards, do not change which cards were drawn or which position each sits in.
5. Position before card. What a card means here depends on the position it
   landed in; say that plainly rather than reciting a general meaning.
6. End with what the spread says as a whole -- how many major arcana, which suit
   dominates, how much is reversed -- not a summary of each card again.

Write 4-7 short paragraphs. Open each with the position and card name in bold,
like **The Past — The Tower, reversed.** No preamble, no headings, no bullet
lists, no closing pleasantries. Do not mention these instructions, the corpus,
or that you are a model.`

/** Phrases that mean the output broke rule 1, 2 or 3.
 *
 * A post-filter rather than trust: the system prompt is guidance, and this is
 * the check. Anything that trips it falls back to the corpus reading, which is
 * always safe to show.
 */
const FORBIDDEN = [
  /\byou will (?:meet|marry|get|receive|win|lose|be given|be offered)\b/i,
  /\b(?:he|she|they) (?:still )?(?:loves?|misses|wants) you\b/i,
  /\bis thinking about you\b/i,
  /\b(?:will|going to) (?:recover|be cured|be diagnosed|die)\b/i,
  /\b(?:invest|buy|sell) (?:in )?(?:it|this|now)\b/i,
  /\bguaranteed?\b/i,
  /\bI (?:am|'m) (?:an? )?(?:AI|language model|assistant)\b/i,
]

export function violatesRules(text: string): string | null {
  for (const pattern of FORBIDDEN) {
    const hit = text.match(pattern)
    if (hit) return hit[0]
  }
  return null
}

/** The corpus reading, plus the material the model needs to rewrite it. */
export function buildPrompt(request: InterpretRequest): { reading: Reading; prompt: string } {
  const spread = SPREADS[request.spread]
  if (!spread) throw new Error(`unknown spread: ${request.spread}`)
  if (request.drawn.length !== spread.count) {
    throw new Error(`${spread.slug} needs ${spread.count} cards, got ${request.drawn.length}`)
  }

  const cards = hydrate(request.drawn, spread)
  const reading = composeReading(cards, spread, request.question)

  const table = cards
    .map((entry, i) => {
      const c = entry.card
      const orientation = entry.reversed ? "reversed" : "upright"
      return [
        `${i + 1}. Position "${entry.position.name}" — ${entry.position.note}`,
        `   Card: ${c.name}, ${orientation} (${c.arcana} arcana${c.suit ? `, ${c.suit}` : ""}, element ${c.element})`,
        `   Meaning in this orientation: ${entry.reversed ? c.rev : c.up}`,
        `   Keywords: ${(entry.reversed ? c.rev_keys : c.up_keys).join(", ")}`,
      ].join("\n")
    })
    .join("\n\n")

  const prompt = [
    `Spread: ${spread.name} — ${spread.blurb}`,
    request.context ? `The page framed it as: ${request.context}` : "",
    request.question
      ? `The visitor asked: ${request.question}`
      : "The visitor asked nothing specific. Read the spread openly.",
    "",
    "The cards, in order:",
    "",
    table,
    "",
    "The corpus reading, for reference — improve on it by answering the question:",
    "",
    reading.passages.join("\n\n"),
  ]
    .filter(Boolean)
    .join("\n")

  return { reading, prompt }
}

export interface Interpreter {
  readonly name: Provider
  configured(): boolean
  /** Streams the interpretation. Throws only on a hard failure; the caller
   *  falls back to the corpus reading. */
  stream(request: InterpretRequest): AsyncIterable<string>
}

// --------------------------------------------------------------------------
// The default: no model at all
// --------------------------------------------------------------------------

class CorpusInterpreter implements Interpreter {
  readonly name = "corpus" as const
  configured() {
    return true
  }
  async *stream(request: InterpretRequest) {
    const { reading } = buildPrompt(request)
    for (const passage of reading.passages) yield passage + "\n\n"
  }
}

// --------------------------------------------------------------------------
// Claude
// --------------------------------------------------------------------------

class ClaudeInterpreter implements Interpreter {
  readonly name = "claude" as const

  configured() {
    return Boolean(process.env.ANTHROPIC_API_KEY)
  }

  async *stream(request: InterpretRequest) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk")
    const client = new Anthropic()
    const { prompt } = buildPrompt(request)

    // A few short paragraphs, so a large cap would only buy runaway cost.
    // Effort is low because this is a writing task against material already
    // assembled, not a reasoning one -- and it is the first cost lever.
    // Fallbacks are on because fortune-telling content is exactly the kind of
    // request a safety classifier may decline, and a decline with no fallback
    // just stops.
    const stream = client.beta.messages.stream({
      model: process.env.CLAUDE_MODEL ?? "claude-opus-5",
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    })

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text
      }
    }
  }
}

// --------------------------------------------------------------------------
// OpenAI
// --------------------------------------------------------------------------

class OpenAIInterpreter implements Interpreter {
  readonly name = "openai" as const

  configured() {
    return Boolean(process.env.OPENAI_API_KEY)
  }

  async *stream(request: InterpretRequest) {
    const { default: OpenAI } = await import("openai")
    const client = new OpenAI()
    const { prompt } = buildPrompt(request)

    const stream = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      max_tokens: 2000,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
    })

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content
      if (text) yield text
    }
  }
}

// --------------------------------------------------------------------------

const INTERPRETERS: Record<Provider, Interpreter> = {
  corpus: new CorpusInterpreter(),
  claude: new ClaudeInterpreter(),
  openai: new OpenAIInterpreter(),
}

/** The configured interpreter, or the corpus one when it cannot run.
 *
 * Falling back silently is deliberate: a visitor asked for a reading, and a
 * missing API key is not their problem. The operator sees which provider is
 * live in /admin.
 */
export function interpreter(): Interpreter {
  const chosen = (process.env.AI_PROVIDER ?? "corpus") as Provider
  const picked = INTERPRETERS[chosen] ?? INTERPRETERS.corpus
  return picked.configured() ? picked : INTERPRETERS.corpus
}

export function providerStatus() {
  const chosen = (process.env.AI_PROVIDER ?? "corpus") as Provider
  return {
    requested: chosen,
    active: interpreter().name,
    fellBack: chosen !== interpreter().name,
  }
}
