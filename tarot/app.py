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
import re
import secrets
from datetime import date, datetime
from functools import lru_cache
from pathlib import Path

from flask import (
    Flask,
    Response,
    abort,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    stream_with_context,
    url_for,
)
from markupsafe import escape

import cardart
import correspondences
import payments
import personal
import store
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
    HUMAN_READINGS=os.environ.get("HUMAN_READINGS", "1") == "1",
    PAYMENT_PROVIDER=os.environ.get("PAYMENT_PROVIDER", "manual"),
    ADMIN_KEY=os.environ.get("ADMIN_KEY", ""),
    WAFFO_API_KEY=os.environ.get("WAFFO_API_KEY", ""),
    WAFFO_STORE_SLUG=os.environ.get("WAFFO_STORE_SLUG", ""),
    WAFFO_ENVIRONMENT=os.environ.get("WAFFO_ENVIRONMENT", "sandbox"),
    WAFFO_PRODUCT_ID=os.environ.get("WAFFO_PRODUCT_ID", ""),
    WAFFO_WEBHOOK_SECRET=os.environ.get("WAFFO_WEBHOOK_SECRET", ""),
)

# A missing key is survivable in development and not in production: sessions
# would silently reset on every restart, signing readers out mid-queue.
app.secret_key = os.environ.get("SECRET_KEY") or secrets.token_hex(32)
if not os.environ.get("SECRET_KEY"):
    app.logger.warning("SECRET_KEY unset — reader sessions will not survive a restart")

store.init_db()


@app.before_request
def _retention():
    """Expired orders are deleted on the way past, at most hourly."""
    store.purge_expired()

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

_MD_BOLD = re.compile(r"\*\*([^*]+)\*\*")
_MD_ITALIC = re.compile(r"\*([^*]+)\*")


@app.template_filter("md")
def render_md(text):
    """The same restrained subset the client renders: bold, italic, nothing else.

    Escape first, then substitute, so a stray asterisk in a card name or a
    user's question can never introduce markup.
    """
    out = escape(text)
    out = _MD_BOLD.sub(r"<strong>\1</strong>", str(out))
    return _MD_ITALIC.sub(r"<em>\1</em>", out)



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
    today, today_rev = personal.card_of_the_day()
    return render_template(
        "index.html",
        featured=featured,
        today=today,
        today_rev=today_rev,
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
        "share": url_for("shared_reading", code=personal.encode_reading(spread["slug"], drawn)),
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


@app.get("/api/card-art")
def api_card_art():
    """SVG faces for a handful of slugs, for pages that build their card list
    in the browser. Capped so it cannot be used to pull the whole deck."""
    wanted = (request.args.get("slugs") or "").split(",")[:12]
    return jsonify({
        slug: cardart.card_svg(CARDS_BY_SLUG[slug])
        for slug in wanted if slug in CARDS_BY_SLUG
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
# Routes — personal
#
# Tarot has no natal chart, so these three routes build the persistent objects
# it can have: a card identity derived from a birth date, a pattern read across
# your own history, and a reading that survives as a link.
# ---------------------------------------------------------------------------

@app.route("/birth-card")
def birth_card():
    result = None
    args = request.args
    try:
        y, m, d = int(args["y"]), int(args["m"]), int(args["d"])
        if y in personal.YEAR_RANGE and 1 <= m <= 12 and 1 <= d <= personal.MONTH_DAYS[m]:
            personality, soul = personal.birth_cards(y, m, d)
            result = {
                "y": y, "m": m, "d": d,
                "label": f"{personal.MONTH_NAME[m]} {d}, {y}",
                "personality": personality,
                "soul": soul,
                "same": personality["slug"] == soul["slug"],
                "year_card": personal.year_card(date.today().year, m, d),
                "date_slug": f"{personal.MONTHS[m - 1][0]}-{d}",
            }
    except (KeyError, ValueError):
        result = None

    return render_template(
        "birthcard.html",
        result=result,
        months=personal.MONTHS,
        years=list(reversed(personal.YEAR_RANGE)),
        canonical=url_for("birth_card"),
        title=f"What Is My Tarot Birth Card? — {app.config['SITE_NAME']}",
        description=(
            "Find your tarot birth card from your date of birth. The traditional "
            "calculation, with your personality card, soul card and this year's card."
        ),
    )


@app.route("/birth-card/<slug>")
def birth_date_page(slug):
    parsed = personal.valid_date_slug(slug)
    if not parsed:
        abort(404)
    month, day = parsed
    label = f"{personal.MONTH_NAME[month]} {day}"
    groups = personal.date_table(month, day)
    return render_template(
        "birthdate.html",
        label=label,
        month=month,
        day=day,
        groups=groups,
        span=f"{personal.YEAR_RANGE[0]}–{personal.YEAR_RANGE[-1]}",
        title=f"Tarot Birth Card for {label} — Every Birth Year",
        description=(
            f"Born on {label}? Your tarot birth card depends on your birth year. "
            f"Every year from {personal.YEAR_RANGE[0]} to {personal.YEAR_RANGE[-1]}, "
            f"with personality and soul cards."
        ),
    )


@app.route("/my-deck")
def my_deck():
    """Reads nothing server-side — the history lives in the visitor's browser."""
    return render_template(
        "mydeck.html",
        noindex=True,
        title=f"Your Deck — {app.config['SITE_NAME']}",
        description="Patterns across your own readings: recurring cards, suit balance and reversals.",
    )


@app.route("/r/<code>")
def shared_reading(code):
    decoded = personal.decode_reading(code)
    if not decoded:
        abort(404)
    spread, drawn = decoded
    cards = hydrate(drawn, spread)
    paras = compose_reading(cards, spread)
    return render_template(
        "shared.html",
        noindex=True,
        spread=spread,
        cards=cards,
        paras=paras,
        code=code,
        title=f"A {spread['name']} reading — {app.config['SITE_NAME']}",
        description=", ".join(
            f"{e['card']['name']}{' reversed' if e['reversed'] else ''}" for e in cards
        ),
    )


# ---------------------------------------------------------------------------
# Routes — intake and report
#
# The free tool answers a question the visitor already knows how to ask. The
# report asks first, which is a different funnel: it earns the right to say
# something specific, and it is the natural place an email would be exchanged
# once there is somewhere lawful to put one.
# ---------------------------------------------------------------------------

FOCUS_AREAS = [
    ("love", "Love & relationships", "relationship",
     "Someone specific, or the pattern across several."),
    ("career", "Work & direction", "situation",
     "A role, a move, or the question of whether to stay."),
    ("money", "Money & security", "situation",
     "Not a forecast — the shape of your relationship to it."),
    ("decision", "A decision", "situation",
     "Two options, or one you keep not making."),
    ("general", "Something else", "three-card",
     "No category. Say it in your own words."),
]
FOCUS_BY_KEY = {f[0]: f for f in FOCUS_AREAS}

SITUATION_MAX = 400


@app.get("/report")
def report_form():
    return render_template(
        "report.html",
        focus_areas=FOCUS_AREAS,
        situation_max=SITUATION_MAX,
        title=f"Get a Written Tarot Report — {app.config['SITE_NAME']}",
        description=(
            "Answer four questions and get a full written tarot report: a spread "
            "drawn for your situation, read position by position, with your card's "
            "colour and stone."
        ),
    )


@app.post("/report")
def report_result():
    form = request.form
    focus_key = form.get("focus", "general")
    if focus_key not in FOCUS_BY_KEY:
        focus_key = "general"
    _, focus_label, spread_slug, _ = FOCUS_BY_KEY[focus_key]
    spread = SPREADS[spread_slug]

    situation = " ".join((form.get("situation") or "").split())[:SITUATION_MAX]
    tried = " ".join((form.get("tried") or "").split())[:SITUATION_MAX]

    drawn = draw_cards(spread["count"])
    cards = hydrate(drawn, spread)
    paras = compose_reading(cards, spread, situation)

    # The palette comes from the card carrying the most weight in the spread:
    # the last position for a linear spread, which is where it lands.
    anchor = cards[-1]
    brief = correspondences.brief_for(anchor["card"], anchor["reversed"])

    birth = None
    try:
        y, m, d = int(form["by"]), int(form["bm"]), int(form["bd"])
        if y in personal.YEAR_RANGE and 1 <= m <= 12 and 1 <= d <= personal.MONTH_DAYS[m]:
            p_card, s_card = personal.birth_cards(y, m, d)
            birth = {
                "label": f"{personal.MONTH_NAME[m]} {d}, {y}",
                "personality": p_card,
                "soul": s_card,
                "same": p_card["slug"] == s_card["slug"],
                "year_card": personal.year_card(date.today().year, m, d),
            }
    except (KeyError, ValueError):
        birth = None

    return render_template(
        "report_result.html",
        noindex=True,
        focus_label=focus_label,
        situation=situation,
        tried=tried,
        spread=spread,
        cards=cards,
        paras=paras,
        brief=brief,
        anchor=anchor,
        birth=birth,
        share=url_for("shared_reading",
                      code=personal.encode_reading(spread["slug"], drawn)),
        title=f"Your {spread['name']} report — {app.config['SITE_NAME']}",
        description="A written tarot report drawn for your situation.",
    )


@app.route("/daily")
def daily():
    """What a daily brief contains, rendered as a page.

    The send channel does not exist yet — that needs the ESP and the operating
    entity settled. The content engine does, and this route is how it gets
    reviewed before a single message goes out.
    """
    today, today_rev = personal.card_of_the_day()
    brief = correspondences.brief_for(today, today_rev, variant=date.today().day)
    return render_template(
        "daily.html",
        brief=brief,
        today=date.today(),
        title=f"Today's Card — {app.config['SITE_NAME']}",
        description=(
            "Today's tarot card with its traditional colour and stone, what the "
            "card is about, and the failure mode worth watching."
        ),
    )


# ---------------------------------------------------------------------------
# Routes — human readings
#
# Deliberately a queue with a hand-picked roster, not a marketplace. At this
# scale ratings are noise and a booking calendar is overhead; what a buyer
# actually wants is a named person and a delivery date. Cards are drawn by the
# site the moment a request is made, so the buyer sees their spread immediately
# and waits only for the interpretation.
# ---------------------------------------------------------------------------

def _require_readings():
    if not app.config["HUMAN_READINGS"]:
        abort(404)


def _birth_from(ymd):
    if not ymd:
        return None
    y, m, d = (int(x) for x in ymd.split("-"))
    p_card, s_card = personal.birth_cards(y, m, d)
    return {"personality": p_card, "soul": s_card,
            "same": p_card["slug"] == s_card["slug"]}


@app.route("/readers")
def readers_index():
    _require_readings()
    roster = store.list_readers()
    for r in roster:
        r["load"] = store.reader_load(r["id"])
        r["full"] = r["load"] >= r["capacity"]
    return render_template(
        "readers.html",
        roster=roster,
        title=f"Readings by a Person — {app.config['SITE_NAME']}",
        description=(
            "A small roster of tarot readers who write your reading by hand. "
            "Your cards are drawn immediately; the reading arrives within a day or two."
        ),
    )


@app.route("/readers/<slug>")
def reader_profile(slug):
    _require_readings()
    reader = store.get_reader(slug)
    if not reader or not reader["active"]:
        abort(404)
    reader["load"] = store.reader_load(reader["id"])
    reader["full"] = reader["load"] >= reader["capacity"]
    return render_template(
        "reader.html",
        reader=reader,
        focus_areas=FOCUS_AREAS,
        situation_max=SITUATION_MAX,
        title=f"{reader['name']} — Tarot Reading by Hand",
        description=reader["tagline"] or f"A written tarot reading by {reader['name']}.",
    )


@app.post("/readers/<slug>/request")
def reader_request(slug):
    _require_readings()
    reader = store.get_reader(slug)
    if not reader or not reader["active"]:
        abort(404)
    if store.reader_load(reader["id"]) >= reader["capacity"]:
        abort(409)

    form = request.form
    focus_key = form.get("focus", "general")
    if focus_key not in FOCUS_BY_KEY:
        focus_key = "general"
    _, _, spread_slug, _ = FOCUS_BY_KEY[focus_key]
    spread = SPREADS[spread_slug]

    situation = " ".join((form.get("situation") or "").split())[:SITUATION_MAX]
    if not situation:
        abort(400)
    tried = " ".join((form.get("tried") or "").split())[:SITUATION_MAX]

    birth_ymd = ""
    try:
        y, m, d = int(form["by"]), int(form["bm"]), int(form["bd"])
        if y in personal.YEAR_RANGE and 1 <= m <= 12 and 1 <= d <= personal.MONTH_DAYS[m]:
            birth_ymd = f"{y:04d}-{m:02d}-{d:02d}"
    except (KeyError, ValueError):
        birth_ymd = ""

    drawn = draw_cards(spread["count"])
    token = store.create_order(reader, focus_key, situation, tried, birth_ymd,
                               spread_slug, drawn)
    return redirect(_start_checkout(store.get_order(token)))


@app.route("/order/<token>")
def order_view(token):
    _require_readings()
    order = store.get_order(token)
    if not order:
        abort(404)
    spread = SPREADS[order["spread_slug"]]
    return render_template(
        "order.html",
        noindex=True,
        order=order,
        spread=spread,
        cards=hydrate(order["drawn"], spread),
        birth=_birth_from(order["birth_ymd"]),
        focus_label=FOCUS_BY_KEY[order["focus"]][1],
        title=f"Your reading with {order['reader_name']} — {app.config['SITE_NAME']}",
        description="Your requested reading.",
    )


# ---- reader desk ----------------------------------------------------------

def _current_reader():
    return store.reader_by_key(session.get("reader_key", ""))


@app.route("/desk", methods=["GET", "POST"])
def desk():
    _require_readings()
    error = None
    if request.method == "POST":
        reader = store.reader_by_key(request.form.get("key", "").strip())
        if reader:
            session["reader_key"] = reader["access_key"]
            return redirect(url_for("desk"))
        error = "That key was not recognised."

    reader = _current_reader()
    if not reader:
        return render_template("desk_signin.html", error=error, noindex=True,
                               title="Reader desk", description="Reader sign-in.")

    return render_template(
        "desk.html",
        noindex=True,
        reader=reader,
        orders=store.orders_for_reader(reader["id"]),
        recent=store.orders_for_reader(reader["id"], statuses=("delivered",))[:5],
        earnings=store.reader_earnings(reader["id"]),
        title=f"Desk — {reader['name']}",
        description="Your queue.",
    )


@app.post("/desk/signout")
def desk_signout():
    session.pop("reader_key", None)
    return redirect(url_for("desk"))


@app.route("/desk/<token>")
def desk_order(token):
    _require_readings()
    reader = _current_reader()
    if not reader:
        return redirect(url_for("desk"))
    order = store.get_order(token)
    if not order or order["reader_id"] != reader["id"]:
        abort(404)

    spread = SPREADS[order["spread_slug"]]
    cards = hydrate(order["drawn"], spread)
    return render_template(
        "desk_order.html",
        noindex=True,
        reader=reader,
        order=order,
        spread=spread,
        cards=cards,
        birth=_birth_from(order["birth_ymd"]),
        focus_label=FOCUS_BY_KEY[order["focus"]][1],
        # A starting point the reader edits — never something that ships
        # unread under a person's name.
        draft="\n\n".join(compose_reading(cards, spread, order["situation"])),
        title=f"Order — {order['reader_name']}",
        description="Write this reading.",
    )


@app.post("/desk/<token>/<action>")
def desk_action(token, action):
    _require_readings()
    reader = _current_reader()
    if not reader:
        return redirect(url_for("desk"))
    if action not in ("claim", "release", "deliver"):
        abort(400)

    target = {"claim": "claimed", "release": "open", "deliver": "delivered"}[action]
    if not store.set_status(token, target,
                            reading=request.form.get("reading", ""),
                            reader_id=reader["id"]):
        abort(409)
    return redirect(url_for("desk_order", token=token) if action == "claim"
                    else url_for("desk"))


# ---------------------------------------------------------------------------
# Payment
#
# The provider is chosen by config and reached only through this interface, so
# swapping it is an env change. That matters here more than in most projects:
# this sells in a category processors restrict, so the provider will change at
# least once, probably in a hurry, with live orders in the queue.
# ---------------------------------------------------------------------------

def _provider():
    try:
        return payments.get_provider(app.config)
    except payments.PaymentError as exc:
        app.logger.error("payment provider unavailable: %s", exc)
        return payments.ManualProvider(app.config)


def _start_checkout(order):
    """Returns where to send the buyer next."""
    provider = _provider()
    order_url = url_for("order_view", token=order["token"], _external=True)
    try:
        checkout = provider.create_checkout(
            order, return_url=order_url,
            cancel_url=url_for("reader_profile", slug=order["reader_slug"], _external=True))
    except payments.PaymentError as exc:
        # A failed checkout must not lose the order — it is already drawn and
        # recorded, and the buyer can retry from the order page.
        app.logger.error("checkout failed for %s: %s", order["token"], exc)
        return order_url
    store.set_payment(order["token"], checkout.status, checkout.reference)
    return checkout.url


@app.post("/order/<token>/pay")
def order_pay(token):
    _require_readings()
    order = store.get_order(token)
    if not order:
        abort(404)
    if order["payment_status"] == payments.PAID:
        return redirect(url_for("order_view", token=token))
    return redirect(_start_checkout(order))


@app.post("/webhooks/<provider_name>")
def payment_webhook(provider_name):
    """Provider callbacks.

    Fails closed at every step. An unsigned or unrecognised event is discarded
    with a 400 rather than trusted — an endpoint that accepts a forged 'paid'
    is a way to get paid work for free.
    """
    provider = _provider()
    if provider_name != provider.name:
        abort(404)

    raw = request.get_data()
    if len(raw) > 64 * 1024:
        abort(413)

    result = provider.verify_webhook(dict(request.headers), raw)
    if not result:
        app.logger.warning("rejected %s webhook (signature or shape)", provider_name)
        abort(400)

    reference, status = result
    if status not in payments.PAYMENT_STATUSES:
        abort(400)
    order = store.order_by_payment_ref(reference)
    if not order:
        app.logger.warning("%s webhook for unknown reference", provider_name)
        abort(404)

    store.set_payment(order["token"], status)
    app.logger.info("order %s -> %s", order["token"], status)
    return jsonify({"ok": True})


# ---- operator view, for manual settlement --------------------------------

def _is_admin():
    key = app.config.get("ADMIN_KEY")
    return bool(key) and session.get("admin_key") == key


@app.route("/admin", methods=["GET", "POST"])
def admin():
    _require_readings()
    if not app.config.get("ADMIN_KEY"):
        abort(404)          # no key configured, no admin surface

    error = None
    if request.method == "POST" and "key" in request.form:
        if secrets.compare_digest(request.form["key"], app.config["ADMIN_KEY"]):
            session["admin_key"] = app.config["ADMIN_KEY"]
            return redirect(url_for("admin"))
        error = "That key was not recognised."

    if not _is_admin():
        return render_template("admin_signin.html", error=error, noindex=True,
                               title="Operator", description="Sign in.")

    return render_template(
        "admin.html",
        noindex=True,
        orders=store.unpaid_orders(),
        provider=_provider().name,
        title="Awaiting settlement",
        description="Orders not yet paid.",
    )


@app.route("/admin/payouts")
def admin_payouts():
    """What is owed to each reader.

    The provider settles to one payee and does not split, so this ledger is the
    only record of what the site owes. Money moves by invoice, out of band.
    """
    _require_readings()
    if not _is_admin():
        return redirect(url_for("admin"))
    return render_template(
        "admin_payouts.html",
        noindex=True,
        owed=store.payouts_owed(),
        title="Reader payouts",
        description="What is owed to each reader.",
    )


@app.post("/admin/payouts/<slug>/settle")
def admin_settle(slug):
    _require_readings()
    if not _is_admin():
        abort(403)
    reader = store.get_reader(slug)
    if not reader:
        abort(404)
    jobs, cents = store.settle_reader(reader["id"])
    app.logger.info("settled %s: %s jobs, %s cents", slug, jobs, cents)
    return redirect(url_for("admin_payouts"))


@app.post("/admin/<token>/paid")
def admin_mark_paid(token):
    _require_readings()
    if not _is_admin():
        abort(403)
    if not store.get_order(token):
        abort(404)
    store.set_payment(token, payments.PAID, f"manual:{token}")
    return redirect(url_for("admin"))


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
        (url_for("birth_card"), "0.9"),
        (url_for("report_form"), "0.9"),
        (url_for("daily"), "0.8"),
    ]
    if app.config["HUMAN_READINGS"]:
        urls.append((url_for("readers_index"), "0.9"))
        urls += [(url_for("reader_profile", slug=r["slug"]), "0.7")
                 for r in store.list_readers()]
    if app.config["HUMAN_READINGS"]:
        urls.append((url_for("readers_index"), "0.9"))
        urls += [(url_for("reader_profile", slug=r["slug"]), "0.7")
                 for r in store.list_readers()]
    urls += [(url_for("birth_date_page", slug=s), "0.7") for s in personal.all_date_slugs()]
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
        # Interactive, private or unbounded surfaces. None of these should ever
        # enter an index: /reading and /report results are per-visitor, /r/ and
        # /order/ are unguessable links to someone's own reading, /desk is staff.
        "Disallow: /reading/",
        "Disallow: /api/",
        "Disallow: /r/",
        "Disallow: /my-deck",
        "Disallow: /order/",
        "Disallow: /desk",
        "Disallow: /admin",
        "Disallow: /webhooks/",
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
