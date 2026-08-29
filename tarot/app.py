"""Arcana Press — an online tarot reading site.

Two things live here: a reading engine (draw, interpret, stream) and a
programmatic content library (card pages, context pages, combination pages)
that exists to be indexed.

The two are deliberately separated. Content pages are composed synchronously
from `tarot_data` with no model call in the request path — crawlers get a
stable page and a low TTFB. The model is used only on the interactive reading
route, which is `noindex` and does not need to be fast for a bot.
"""

from __future__ import annotations

import json
import os
import secrets
from datetime import date, datetime
from functools import lru_cache
from pathlib import Path

from flask import (
    Flask,
    Response,
    abort,
    jsonify,
    render_template,
    request,
    stream_with_context,
    url_for,
)

import cardart
from tarot_data import (
    CARDS,
    CARDS_BY_SLUG,
    CONTEXT_LABELS,
    CONTEXTS,
    MAJOR_SLUGS,
    RANKS,
    SPREADS,
    SUITS,
)

try:
    from openai import OpenAI
except ImportError:  # optional — the site is fully functional without it
    OpenAI = None


def load_env_file() -> None:
    env_path = Path(__file__).with_name(".env")
    if not env_path.exists():
        return
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file()

app = Flask(__name__)
app.config.update(
    SITE_NAME=os.environ.get("SITE_NAME", "Arcana Press"),
    SITE_URL=os.environ.get("PUBLIC_SITE_URL", "http://localhost:5000").rstrip("/"),
    SITE_TAGLINE=os.environ.get(
        "SITE_TAGLINE", "A tarot reading that answers the question you actually asked."
    ),
    OPENAI_API_KEY=os.environ.get("OPENAI_API_KEY", ""),
    OPENAI_MODEL=os.environ.get("OPENAI_MODEL", "gpt-4.1-mini"),
    QUESTION_MAX_CHARS=int(os.environ.get("QUESTION_MAX_CHARS", "160")),
    # Which combination pages enter the sitemap. The build ships 6,084 routes;
    # the roadmap stages them behind an indexation check, so the default only
    # submits the 484 major-on-major pages.
    COMBO_SITEMAP_SCOPE=os.environ.get("COMBO_SITEMAP_SCOPE", "majors"),
)

_openai_client = None
if OpenAI and app.config["OPENAI_API_KEY"]:
    _openai_client = OpenAI(api_key=app.config["OPENAI_API_KEY"])


# ---------------------------------------------------------------------------
# Draw mechanics
# ---------------------------------------------------------------------------

def draw_cards(count, allow_reversed=True):
    """Draw without replacement using the system CSPRNG.

    `secrets` rather than `random` is a deliberate choice: this is the one
    mechanic users are entitled to be suspicious about, and the site says
    plainly on the page which source it uses.
    """
    deck = list(CARDS)
    drawn = []
    for _ in range(count):
        card = deck.pop(secrets.randbelow(len(deck)))
        drawn.append({
            "slug": card["slug"],
            "reversed": bool(secrets.randbelow(2)) if allow_reversed else False,
        })
    return drawn


def hydrate(drawn, spread):
    """Attach card records and position metadata to a raw draw."""
    out = []
    for i, item in enumerate(drawn):
        card = CARDS_BY_SLUG[item["slug"]]
        pos_name, pos_desc = spread["positions"][i]
        out.append({
            "card": card,
            "reversed": item["reversed"],
            "position": pos_name,
            "position_desc": pos_desc,
            "svg": cardart.card_svg(card, item["reversed"]),
        })
    return out


# ---------------------------------------------------------------------------
# Interpretation
#
# The composed reading is not a placeholder for the model — it is the floor.
# It always runs, it is what a user without an API key gets, and it is what
# the streaming endpoint falls back to on any model error.
# ---------------------------------------------------------------------------

YESNO_WEIGHT = {"yes": 1, "maybe": 0, "no": -1}


def compose_reading(cards, spread, question=""):
    """Build a structured reading from the card corpus alone."""
    paras = []

    if question:
        paras.append(
            f"You asked: *{question}* — here is what the {spread['name'].lower()} "
            f"turned up."
        )

    for entry in cards:
        card = entry["card"]
        rev = entry["reversed"]
        keys = card["rev_keys"] if rev else card["up_keys"]
        body = card["rev"] if rev else card["up"]
        orient = "reversed" if rev else "upright"
        paras.append(
            f"**{entry['position']} — {card['name']}, {orient}.** "
            f"{entry['position_desc']} {body} "
            f"The threads to hold: {', '.join(keys[:3])}."
        )

    paras.append(_synthesise(cards, spread))
    return paras


def _synthesise(cards, spread):
    """The part that makes a spread more than a list of cards."""
    if spread["slug"] == "yes-no":
        card = cards[0]["card"]
        lean = card["yesno"]
        if cards[0]["reversed"]:
            lean = {"yes": "maybe", "maybe": "no", "no": "maybe"}[lean]
        verdict = {
            "yes": "Yes — and the card is not hedging.",
            "maybe": "Not yet. The situation is still forming.",
            "no": "No, or not on these terms.",
        }[lean]
        return f"**The answer.** {verdict} {card['name']} carries that direction because it is about " \
               f"{card['up_keys'][0]}, and that is the axis your question turns on."

    majors = [c for c in cards if c["card"]["arcana"] == "major"]
    reversals = [c for c in cards if c["reversed"]]
    suits = [c["card"]["suit"] for c in cards if c["card"]["suit"]]

    bits = []
    if len(majors) >= max(2, len(cards) // 2):
        bits.append(
            f"{len(majors)} of {len(cards)} cards are major arcana, which reads as a situation "
            "larger than day-to-day management — the forces here are structural, not tactical."
        )
    elif not majors:
        bits.append(
            "No major arcana in this spread. That is good news: this is a practical situation "
            "with practical levers, not a fated one."
        )

    if suits:
        dominant = max(set(suits), key=suits.count)
        if suits.count(dominant) >= max(2, len(suits) // 2 + 1):
            s = SUITS[dominant]
            bits.append(
                f"{s['name']} dominate, so the centre of gravity is {s['domain']}. "
                f"Solutions from a different register will slide off."
            )

    if len(reversals) >= max(2, len(cards) * 2 // 3):
        bits.append(
            "Most of the spread is reversed. That usually means the energy is present but "
            "blocked, internalised or badly timed — rarely that it is absent."
        )
    elif not reversals and len(cards) > 1:
        bits.append("Nothing is reversed. What the cards describe is moving openly and outwardly.")

    if not bits:
        bits.append(
            "The spread is mixed, which is the ordinary case: no single force is running the "
            "situation, and the leverage is in the position you can actually act on."
        )

    return "**Reading the spread as a whole.** " + " ".join(bits)


def _model_prompt(cards, spread, question):
    lines = [
        f"Spread: {spread['name']} — {spread['blurb']}",
        f"Question: {question or '(none given — read openly)'}",
        "",
        "Cards drawn:",
    ]
    for e in cards:
        c = e["card"]
        orient = "reversed" if e["reversed"] else "upright"
        keys = c["rev_keys"] if e["reversed"] else c["up_keys"]
        lines.append(
            f"- {e['position']} ({e['position_desc']}): {c['name']}, {orient}. "
            f"Keywords: {', '.join(keys)}. Traditional sense: "
            f"{c['rev'] if e['reversed'] else c['up']}"
        )
    return "\n".join(lines)


SYSTEM_PROMPT = (
    "You are an experienced tarot reader writing for someone who asked a real question. "
    "Read the cards in their positions, then read the spread as a whole — the relationships "
    "between cards matter more than the individual meanings.\n\n"
    "Rules:\n"
    "- Address the querent's actual question. Do not restate card meanings generically.\n"
    "- One short paragraph per card position, then a final paragraph synthesising the spread.\n"
    "- Concrete and grounded. No mystical filler, no 'the universe', no flattery.\n"
    "- Never predict health outcomes, legal results, or financial returns. Never claim certainty "
    "about the future. Frame everything as a lens on the present situation.\n"
    "- Warm but direct. Say the uncomfortable thing if the cards say it.\n"
    "- Use **bold** to open each paragraph with the position and card name.\n"
    "- Do not mention that you are an AI or a language model."
)


def stream_interpretation(cards, spread, question):
    """Yield SSE frames. Falls back to the composed reading on any model failure."""

    def frame(event, data):
        return f"event: {event}\ndata: {json.dumps(data)}\n\n"

    if _openai_client is None:
        for para in compose_reading(cards, spread, question):
            yield frame("para", {"text": para})
        yield frame("done", {"source": "composed"})
        return

    try:
        stream = _openai_client.chat.completions.create(
            model=app.config["OPENAI_MODEL"],
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _model_prompt(cards, spread, question)},
            ],
            stream=True,
            max_tokens=1100,
            temperature=0.85,
        )
        buffer = ""
        for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            if not delta:
                continue
            buffer += delta
            while "\n\n" in buffer:
                para, buffer = buffer.split("\n\n", 1)
                if para.strip():
                    yield frame("para", {"text": para.strip()})
        if buffer.strip():
            yield frame("para", {"text": buffer.strip()})
        yield frame("done", {"source": "model"})
    except Exception as exc:  # noqa: BLE001 — any model failure degrades to composed
        app.logger.warning("interpretation fell back to composed reading: %s", exc)
        for para in compose_reading(cards, spread, question):
            yield frame("para", {"text": para})
        yield frame("done", {"source": "composed-fallback"})


# ---------------------------------------------------------------------------
# Content composition for indexable pages
# ---------------------------------------------------------------------------

@lru_cache(maxsize=2048)
def card_page_body(slug, context):
    """Compose the prose body for one card × context page."""
    card = CARDS_BY_SLUG[slug]
    label = CONTEXT_LABELS[context]
    paras = []

    if context == "general":
        paras.append(("Upright", card["up"]))
        paras.append(("Reversed", card["rev"]))
    elif context == "yes-no":
        verdict = {
            "yes": "This is a yes card.",
            "maybe": "This card does not resolve to a clean yes or no.",
            "no": "This reads as a no, or a not-yet.",
        }[card["yesno"]]
        paras.append((
            "Upright",
            f"{verdict} {card['up']} In a yes-or-no draw the question to ask is whether your "
            f"situation matches that description — if it does, the answer follows.",
        ))
        rev_lean = {"yes": "softens toward maybe", "maybe": "tips toward no",
                    "no": "eases toward maybe"}[card["yesno"]]
        paras.append((
            "Reversed",
            f"Reversed, the answer {rev_lean}. {card['rev']}",
        ))
    else:
        up_line, rev_line = card["ctx"][context]
        paras.append((
            "Upright",
            f"{up_line} {card['up']}",
        ))
        paras.append((
            "Reversed",
            f"{rev_line} {card['rev']}",
        ))

    intro = (
        f"{card['name']} in the context of {label.lower()}. "
        f"{'Major arcana' if card['arcana'] == 'major' else SUITS[card['suit']]['name']}"
        f"{'' if card['arcana'] == 'major' else ' — ' + SUITS[card['suit']]['domain']}"
        f", element {card['element']}."
    )
    return intro, paras


def related_cards(card, limit=6):
    """Cards worth linking from this one — the internal-link fabric."""
    out = []
    if card["arcana"] == "major":
        idx = MAJOR_SLUGS.index(card["slug"])
        for offset in (-1, 1, -2, 2):
            j = idx + offset
            if 0 <= j < len(MAJOR_SLUGS):
                out.append(CARDS_BY_SLUG[MAJOR_SLUGS[j]])
    else:
        for other in CARDS:
            if other["arcana"] != "minor" or other["slug"] == card["slug"]:
                continue
            same_suit = other["suit"] == card["suit"]
            same_rank = other["number"] == card["number"]
            if same_rank or (same_suit and abs(other["number"] - card["number"]) == 1):
                out.append(other)
    seen, uniq = set(), []
    for c in out:
        if c["slug"] not in seen:
            seen.add(c["slug"])
            uniq.append(c)
    return uniq[:limit]


def combo_reading(a, b):
    """Compose the body of a two-card combination page."""
    shared = []
    if a["element"] == b["element"]:
        shared.append(f"Both cards sit in {a['element']}, which doubles the register rather "
                      f"than balancing it — expect intensity rather than nuance.")
    if a["arcana"] == b["arcana"] == "major":
        shared.append("Two major arcana together describe a structural moment, not a passing mood.")
    elif a["arcana"] == b["arcana"] == "minor" and a["suit"] == b["suit"]:
        shared.append(f"Two {SUITS[a['suit']]['name']} narrow the reading firmly onto "
                      f"{SUITS[a['suit']]['domain']}.")
    elif a["arcana"] != b["arcana"]:
        major, minor = (a, b) if a["arcana"] == "major" else (b, a)
        shared.append(f"{major['name']} sets the theme and {minor['name']} says where it lands "
                      f"in practice.")
    if not shared:
        shared.append("The two cards come from different registers, so read them as cause and "
                      "consequence rather than as a single statement.")

    tension = (
        f"{a['name']} pulls toward {a['up_keys'][0]}; {b['name']} pulls toward "
        f"{b['up_keys'][0]}. Where those two meet is the actual subject of the reading."
    )
    return shared[0], tension


# ---------------------------------------------------------------------------
# Template context
# ---------------------------------------------------------------------------

@app.context_processor
def inject_globals():
    return {
        "site_name": app.config["SITE_NAME"],
        "site_tagline": app.config["SITE_TAGLINE"],
        "site_url": app.config["SITE_URL"],
        "contexts": CONTEXTS,
        "spreads": SPREADS,
        "suits": SUITS,
        "year": date.today().year,
        "card_svg": cardart.card_svg,
        "card_back": cardart.card_back_svg,
    }


# ---------------------------------------------------------------------------
# Routes — reading
# ---------------------------------------------------------------------------

@app.route("/")
def home():
    featured = [CARDS_BY_SLUG[s] for s in ("the-star", "the-tower", "the-sun", "the-moon")]
    return render_template(
        "index.html",
        featured=featured,
        title=f"{app.config['SITE_NAME']} — Free Tarot Reading, Interpreted Properly",
        description=(
            "Free tarot readings with a real interpretation of your question — no signup, "
            "no card limit. Plus meanings for all 78 cards, upright and reversed."
        ),
    )


@app.route("/reading/<slug>")
def reading(slug):
    spread = SPREADS.get(slug)
    if not spread:
        abort(404)
    return render_template(
        "reading.html",
        spread=spread,
        noindex=True,
        title=f"{spread['name']} — {app.config['SITE_NAME']}",
        description=spread["blurb"],
    )


@app.post("/api/draw")
def api_draw():
    payload = request.get_json(silent=True) or {}
    spread = SPREADS.get(payload.get("spread", ""))
    if not spread:
        return jsonify({"error": "unknown spread"}), 400
    allow_rev = bool(payload.get("reversals", True))
    drawn = draw_cards(spread["count"], allow_rev)
    cards = hydrate(drawn, spread)
    return jsonify({
        "spread": spread["slug"],
        "drawn": drawn,
        "cards": [
            {
                "slug": e["card"]["slug"],
                "name": e["card"]["name"],
                "reversed": e["reversed"],
                "position": e["position"],
                "position_desc": e["position_desc"],
                "keywords": (e["card"]["rev_keys"] if e["reversed"] else e["card"]["up_keys"])[:3],
                "url": url_for("card_page", slug=e["card"]["slug"]),
                "svg": e["svg"],
            }
            for e in cards
        ],
    })


@app.post("/api/interpret")
def api_interpret():
    payload = request.get_json(silent=True) or {}
    spread = SPREADS.get(payload.get("spread", ""))
    drawn = payload.get("drawn") or []
    if not spread or len(drawn) != spread["count"]:
        return jsonify({"error": "bad draw"}), 400
    for item in drawn:
        if item.get("slug") not in CARDS_BY_SLUG:
            return jsonify({"error": "unknown card"}), 400

    question = (payload.get("question") or "").strip()[: app.config["QUESTION_MAX_CHARS"]]
    # Strip newlines so a pasted block cannot restructure the prompt.
    question = " ".join(question.split())
    cards = hydrate(drawn, spread)

    return Response(
        stream_with_context(stream_interpretation(cards, spread, question)),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ---------------------------------------------------------------------------
# Routes — content library
# ---------------------------------------------------------------------------

@app.route("/cards")
def cards_index():
    majors = [c for c in CARDS if c["arcana"] == "major"]
    by_suit = {k: [c for c in CARDS if c["suit"] == k] for k in SUITS}
    return render_template(
        "cards.html",
        majors=majors,
        by_suit=by_suit,
        title=f"All 78 Tarot Card Meanings — {app.config['SITE_NAME']}",
        description=(
            "Every card in the tarot deck with upright and reversed meanings, plus readings "
            "for love, career, money, health and yes-or-no questions."
        ),
    )


@app.route("/cards/<slug>")
@app.route("/cards/<slug>/<context>")
def card_page(slug, context="general"):
    card = CARDS_BY_SLUG.get(slug)
    if not card or context not in CONTEXT_LABELS:
        abort(404)
    intro, paras = card_page_body(slug, context)
    label = CONTEXT_LABELS[context]
    suffix = "" if context == "general" else f" — {label}"
    return render_template(
        "card.html",
        card=card,
        context=context,
        context_label=label,
        intro=intro,
        paras=paras,
        related=related_cards(card),
        title=f"{card['name']} Meaning{suffix} — Upright & Reversed",
        description=(
            f"{card['name']} tarot card meaning{suffix.lower()}: "
            f"{', '.join(card['up_keys'][:3])} upright, "
            f"{', '.join(card['rev_keys'][:2])} reversed."
        ),
    )


@app.route("/combinations/<a>/<b>")
def combination(a, b):
    card_a, card_b = CARDS_BY_SLUG.get(a), CARDS_BY_SLUG.get(b)
    if not card_a or not card_b or a == b:
        abort(404)
    shared, tension = combo_reading(card_a, card_b)
    return render_template(
        "combo.html",
        a=card_a,
        b=card_b,
        shared=shared,
        tension=tension,
        title=f"{card_a['name']} and {card_b['name']} Together — Combination Meaning",
        description=(
            f"What {card_a['name']} and {card_b['name']} mean when they appear in the same "
            f"reading, upright and reversed."
        ),
    )


@app.route("/spreads")
def spreads_index():
    return render_template(
        "spreads.html",
        title=f"Tarot Spreads — {app.config['SITE_NAME']}",
        description="Every spread on the site, what each position means and when to use it.",
    )


@app.route("/learn")
def learn():
    return render_template(
        "learn.html",
        title=f"How to Read Tarot — {app.config['SITE_NAME']}",
        description=(
            "How a tarot reading actually works: asking a good question, reading reversals, "
            "and why the spread matters more than the individual cards."
        ),
    )


@app.route("/legal/<page>")
def legal(page):
    pages = {
        "terms": "Terms of Use",
        "privacy": "Privacy",
        "disclaimer": "Disclaimer",
    }
    if page not in pages:
        abort(404)
    return render_template(
        "legal.html",
        page=page,
        heading=pages[page],
        title=f"{pages[page]} — {app.config['SITE_NAME']}",
        description=f"{pages[page]} for {app.config['SITE_NAME']}.",
    )


# ---------------------------------------------------------------------------
# Crawl surface
# ---------------------------------------------------------------------------

def _combo_pairs():
    scope = app.config["COMBO_SITEMAP_SCOPE"]
    if scope == "none":
        return []
    pool = MAJOR_SLUGS if scope == "majors" else [c["slug"] for c in CARDS]
    return [(a, b) for a in pool for b in pool if a != b]


def _sitemap_urls():
    urls = [
        (url_for("home"), "1.0"),
        (url_for("cards_index"), "0.9"),
        (url_for("spreads_index"), "0.7"),
        (url_for("learn"), "0.6"),
    ]
    urls += [(url_for("reading", slug=s), "0.8") for s in SPREADS]
    for card in CARDS:
        for ctx, _ in CONTEXTS:
            urls.append((url_for("card_page", slug=card["slug"], context=ctx), "0.8"))
    urls += [(url_for("combination", a=a, b=b), "0.5") for a, b in _combo_pairs()]
    return urls


CHUNK = 20000


@app.route("/sitemap.xml")
def sitemap_index():
    total = len(_sitemap_urls())
    pages = max(1, -(-total // CHUNK))
    base = app.config["SITE_URL"]
    today = date.today().isoformat()
    body = "".join(
        f"<sitemap><loc>{base}/sitemap-{i}.xml</loc><lastmod>{today}</lastmod></sitemap>"
        for i in range(pages)
    )
    xml = ('<?xml version="1.0" encoding="UTF-8"?>'
           '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
           f"{body}</sitemapindex>")
    return Response(xml, mimetype="application/xml")


@app.route("/sitemap-<int:page>.xml")
def sitemap_page(page):
    urls = _sitemap_urls()[page * CHUNK:(page + 1) * CHUNK]
    if not urls:
        abort(404)
    base = app.config["SITE_URL"]
    body = "".join(
        f"<url><loc>{base}{path}</loc><priority>{pri}</priority></url>"
        for path, pri in urls
    )
    xml = ('<?xml version="1.0" encoding="UTF-8"?>'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
           f"{body}</urlset>")
    return Response(xml, mimetype="application/xml")


@app.route("/robots.txt")
def robots():
    lines = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /reading/",
        "Disallow: /api/",
        "",
        f"Sitemap: {app.config['SITE_URL']}/sitemap.xml",
    ]
    return Response("\n".join(lines), mimetype="text/plain")


@app.route("/healthz")
def healthz():
    return jsonify({
        "ok": True,
        "cards": len(CARDS),
        "spreads": len(SPREADS),
        "indexable_urls": len(_sitemap_urls()),
        "model": bool(_openai_client),
        "time": datetime.utcnow().isoformat() + "Z",
    })


@app.errorhandler(404)
def not_found(_):
    return render_template(
        "404.html",
        noindex=True,
        title=f"Not found — {app.config['SITE_NAME']}",
        description="That page does not exist.",
    ), 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("APP_PORT", "5000")), debug=True)
