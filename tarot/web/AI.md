# Model-written interpretations

The corpus already produces a complete reading. A model is not here to replace
it — it is here to do the one thing the corpus cannot: answer the specific
question someone typed.

## How it fits

```
1. Draw                  browser, CSPRNG           unchanged
2. Corpus reading        browser, from the corpus  unchanged — and the fallback
3. POST /api/interpret   cards + meanings + question → model
4. Stream back           replaces the passages in place
5. Anything wrong        → what stays on screen is step 2
```

Step 5 is the design, not the error path. No key, no budget, a timeout, a
refusal, or output the server rejects all land in the same place: the reading
that was already rendered. The visitor never waits on a model and never sees an
error where a reading should be — the same posture as the `manual` payment
provider and the `console` mailer.

The model is handed **the card meanings**, not just the card names. It can
phrase The Tower badly; it cannot decide The Tower means good luck.

## Configuration

| Variable | Effect |
|---|---|
| `AI_PROVIDER` | `corpus` (default), `claude`, `openai`, or `kie` |
| `ANTHROPIC_API_KEY` | required for `claude` |
| `CLAUDE_MODEL` | defaults to `claude-opus-5` |
| `OPENAI_API_KEY` | required for `openai` |
| `OPENAI_MODEL` | defaults to `gpt-4.1-mini` |
| `KIE_API_KEY` | required for `kie` |
| `KIE_BASE_URL` | defaults to `https://api.kie.ai` |
| `KIE_MODEL` | one of `claude-opus-5`, `claude-opus-4-8`, `gpt-5-5`, `gpt-5-4`, `gemini-3-pro`, `gemini-3-flash` |
| `KIE_TIMEOUT_MS` | defaults to 60000 |
| `AI_RATE_PER_MINUTE` | per-IP cap, default 6 |

## KIE

One key in front of several vendors' models, which is worth having when
Anthropic and OpenAI each want their own account and their own card.

It is a passthrough, so the request shape is the *upstream vendor's*, chosen by
which model you name: Claude models go to `/claude/v1/messages`, GPT to
`/codex/v1/responses`, Gemini to `/{model}/v1/chat/completions`. A model that is
not in the table above is an error before the request rather than a rejection
after it.

Unlike the other two it does not stream. KIE is documented as a non-streaming
passthrough, and guessing at an SSE shape would trade a reading that arrives
whole for one that may not arrive at all. Nobody is left waiting on a blank
page meanwhile: the corpus reading is already on screen and the model's reply
replaces it when it lands.

A reply that hit the token ceiling is discarded rather than shown. A reading
that stops mid-sentence reads as the site being broken, which is worse than the
corpus reading it falls back to.

Set `AI_PROVIDER` to a provider whose key is missing and the site serves the
corpus reading and says so in `/admin` — it does not fail the request.

## What keeps it inside the rules

A model interpretation is the operator's own speech. Anything it asserts, the
operator is asserting. Three layers:

1. **The system prompt** forbids predicting events, claiming to know another
   person's mind, and giving medical, legal or financial advice.
2. **A post-filter** (`violatesRules`) scans the finished text for the phrasings
   those rules exist to prevent. A match discards the whole response and keeps
   the corpus reading.
3. **The corpus supplies the card meanings**, so the model's freedom is at the
   level of wording, not of what a card means.

The question is read, used, and dropped. It is the most sensitive thing on the
site — a stranger's account of their own situation — and nothing logs it or
writes it to the database.

## Cost

Effort is `low` and `max_tokens` is 2000: this is a writing task over material
already assembled, not a reasoning one, and the output is a few short
paragraphs. Server-side fallbacks are enabled on the Claude path, because
fortune-telling content is exactly the kind of request a safety classifier may
decline, and a decline with no fallback simply stops.

Per-IP rate limiting lives in the route handler. It is in-process memory, so it
resets on deploy and does not span instances — anything serious belongs in
front of the app.
