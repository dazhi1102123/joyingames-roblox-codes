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

export type Provider = "corpus" | "claude" | "openai" | "kie"

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
// KIE
//
// One key in front of several vendors' models. Worth having as a third option
// for a China-based operator: Anthropic and OpenAI both need their own
// account and their own card, and KIE is one of each.
//
// It is a passthrough, so the request shape is the *upstream* vendor's, chosen
// by which model you name -- three different bodies behind one base URL. The
// table below is the whole of that mapping; a model that is not in it is an
// error at call time rather than a request KIE will reject.
// --------------------------------------------------------------------------

type KieShape =
  | { api: "claude"; model: string }
  | { api: "responses"; model: string }
  | { api: "chat"; model: string; path: string }

const KIE_MODELS: Record<string, KieShape> = {
  "claude-opus-5": { api: "claude", model: "claude-opus-5" },
  "claude-opus-4-8": { api: "claude", model: "claude-opus-4-8" },
  "gpt-5-5": { api: "responses", model: "gpt-5-5" },
  "gpt-5-4": { api: "responses", model: "gpt-5-4" },
  "gemini-3-pro": { api: "chat", model: "gemini-3-pro", path: "gemini-3-pro" },
  "gemini-3-flash": { api: "chat", model: "gemini-2.5-flash", path: "gemini-3-flash" },
}

class KieInterpreter implements Interpreter {
  readonly name = "kie" as const

  configured() {
    return Boolean(process.env.KIE_API_KEY) && Boolean(this.shape())
  }

  private shape(): KieShape | undefined {
    return KIE_MODELS[process.env.KIE_MODEL ?? "claude-opus-5"]
  }

  private async post(path: string, body: unknown, extra: Record<string, string> = {}) {
    const base = (process.env.KIE_BASE_URL ?? "https://api.kie.ai").replace(/\/+$/, "")
    // A hung upstream would otherwise hold the reading open until the
    // platform's own timeout, which is far longer than anyone will wait.
    const abort = AbortSignal.timeout(Number(process.env.KIE_TIMEOUT_MS ?? 60_000))
    const response = await fetch(base + path, {
      method: "POST",
      signal: abort,
      headers: {
        Authorization: `Bearer ${process.env.KIE_API_KEY}`,
        "Content-Type": "application/json",
        ...extra,
      },
      body: JSON.stringify(body),
    })
    // Read as text first: an upstream error page is HTML, and response.json()
    // on it throws a SyntaxError that says nothing about what went wrong.
    const raw = await response.text()
    if (!response.ok) throw new Error(`KIE ${response.status}: ${raw.slice(0, 300)}`)
    try {
      return JSON.parse(raw) as Record<string, any>
    } catch {
      throw new Error(`KIE returned non-JSON: ${raw.slice(0, 300)}`)
    }
  }

  /** One request, one chunk.
   *
   * KIE is documented as a non-streaming passthrough, and guessing at an SSE
   * shape here would trade a reading that arrives whole for one that may not
   * arrive at all. The visitor is not left staring at nothing meanwhile: the
   * corpus reading is already on screen and this replaces it when it lands.
   */
  async *stream(request: InterpretRequest) {
    const shape = this.shape()
    if (!shape) throw new Error(`KIE_MODEL is not one of: ${Object.keys(KIE_MODELS).join(", ")}`)
    const { prompt } = buildPrompt(request)

    if (shape.api === "claude") {
      const data = await this.post(
        "/claude/v1/messages",
        {
          model: shape.model,
          max_tokens: 2000,
          stream: false,
          system: SYSTEM,
          messages: [{ role: "user", content: prompt }],
        },
        { "anthropic-version": "2023-06-01" },
      )
      // A truncated reading is worse than none: it stops mid-sentence and
      // reads as the site breaking. Throwing keeps the corpus reading.
      if (data.stop_reason === "max_tokens") throw new Error("KIE truncated the reading")
      yield (data.content ?? [])
        .filter((b: any) => b?.type === "text" && typeof b.text === "string")
        .map((b: any) => b.text)
        .join("")
      return
    }

    if (shape.api === "responses") {
      const data = await this.post("/codex/v1/responses", {
        model: shape.model,
        instructions: SYSTEM,
        input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
        stream: false,
        reasoning: { effort: "low" },
      })
      if (data.incomplete_details?.reason === "max_output_tokens") {
        throw new Error("KIE truncated the reading")
      }
      const parts: string[] = []
      for (const item of data.output ?? []) {
        for (const block of item.content ?? []) {
          if (typeof block?.text === "string") parts.push(block.text)
        }
      }
      yield parts.join("")
      return
    }

    // Chat Completions: the model is selected by the URL path, not the body.
    const data = await this.post(`/${shape.path}/v1/chat/completions`, {
      stream: false,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
    })
    if (data.choices?.[0]?.finish_reason === "length") {
      throw new Error("KIE truncated the reading")
    }
    const content = data.choices?.[0]?.message?.content
    yield typeof content === "string" ? content : ""
  }
}

// --------------------------------------------------------------------------

const INTERPRETERS: Record<Provider, Interpreter> = {
  corpus: new CorpusInterpreter(),
  claude: new ClaudeInterpreter(),
  openai: new OpenAIInterpreter(),
  kie: new KieInterpreter(),
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
