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
| `AI_PROVIDER` | `corpus` (default), `claude`, or `openai` |
| `ANTHROPIC_API_KEY` | required for `claude` |
| `CLAUDE_MODEL` | defaults to `claude-opus-5` |
| `OPENAI_API_KEY` | required for `openai` |
| `OPENAI_MODEL` | defaults to `gpt-4.1-mini` |
| `AI_RATE_PER_MINUTE` | per-IP cap, default 6 |

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
