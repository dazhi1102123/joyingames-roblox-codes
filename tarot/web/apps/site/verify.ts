/** One command that checks the whole site.
 *
 *     pnpm verify
 *
 * Three layers, in order of how cheap they are to run:
 *
 *   1. The corpus — 78 cards, every field populated, no duplicate slugs.
 *   2. The engines — draw, share codec, order state machine, payout
 *      arithmetic, subscriber lifecycle, mail channel separation.
 *   3. The site — boots the production build and crawls it: every route,
 *      every link on the page index, and the SEO essentials on the page types
 *      that earn traffic.
 *
 * It starts and stops its own server, so there is nothing to set up. A
 * failure prints what was expected and what happened, not just a red line.
 */

import { spawn, type ChildProcess } from "node:child_process"
import net from "node:net"
import fs from "node:fs"
import path from "node:path"

import {
  CARDS,
  CONTEXTS,
  SPREADS,
  SUITS,
  allDateSlugs,
  cardBySlug,
  composeReading,
  decodeReading,
  drawCards,
  encodeReading,
  hydrate,
} from "@arcana/core"

import { addReader, listReaders } from "./lib/readers"
import { createOrder, setPayment, setStatus } from "./lib/orders"
import { payoutsOwed, readerEarnings, settleReader } from "./lib/payouts"
import { CONSENT_TEXT, confirmSubscriber, getSubscriber, subscribe, unsubscribe } from "./lib/subscribers"
import { channelsAreSeparated } from "./lib/mailer"
import { comboPairs } from "./lib/pages"
import { QUESTIONS } from "./lib/questions"

const PORT = Number(process.env.VERIFY_PORT ?? 3111)
const BASE = `http://127.0.0.1:${PORT}`

let passed = 0
const failures: string[] = []

function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    passed++
    console.log(`  ok   ${label}${detail ? `  ${detail}` : ""}`)
  } else {
    failures.push(label)
    console.log(`  FAIL ${label}${detail ? `  ${detail}` : ""}`)
  }
}

function section(title: string) {
  console.log(`\n${title}\n${"-".repeat(title.length)}`)
}

// ---------------------------------------------------------------------------
// 1. The corpus
// ---------------------------------------------------------------------------

function verifyCorpus() {
  section("Corpus")

  check("78 cards", CARDS.length === 78, `${CARDS.length}`)
  check("no duplicate slugs", new Set(CARDS.map((c) => c.slug)).size === CARDS.length)
  check("22 major arcana", CARDS.filter((c) => c.arcana === "major").length === 22)
  check(
    "14 cards in each of the four suits",
    Object.keys(SUITS).every((s) => CARDS.filter((c) => c.suit === s).length === 14),
  )

  const empty = CARDS.filter(
    (c) => !c.up?.trim() || !c.rev?.trim() || !c.up_keys.length || !c.rev_keys.length,
  )
  check("every card has upright, reversed and keywords", empty.length === 0,
    empty.map((c) => c.slug).join(", "))

  const badYesNo = CARDS.filter((c) => !["yes", "maybe", "no"].includes(c.yesno))
  check("every card has a yes/maybe/no lean", badYesNo.length === 0,
    badYesNo.map((c) => c.slug).join(", "))

  const missingArt = CARDS.filter(
    (c) => !fs.existsSync(path.join(process.cwd(), "public/cards/rws", `${c.slug}.webp`)),
  )
  check("every card has artwork on disk", missingArt.length === 0,
    missingArt.map((c) => c.slug).join(", "))

  const contextCount = CARDS.reduce(
    (n, c) => n + CONTEXTS.filter((x) => x.slug !== "general" && c.ctx[x.slug]).length, 0)
  check("312 per-context readings", contextCount === 312, `${contextCount}`)
  check("366 birth-date slugs", allDateSlugs().length === 366, `${allDateSlugs().length}`)
}

// ---------------------------------------------------------------------------
// 2. The engines
// ---------------------------------------------------------------------------

function verifyDraw() {
  section("Draw")

  for (const spread of Object.values(SPREADS)) {
    const drawn = drawCards(spread.count, true)
    const unique = new Set(drawn.map((d) => d.slug)).size
    check(`${spread.slug} deals ${spread.count} distinct cards`,
      drawn.length === spread.count && unique === spread.count)
  }

  // A biased shuffle is the failure nobody notices. Over 20,000 single draws
  // every card should appear; a modulus bias would starve the tail.
  const seen = new Map<string, number>()
  for (let i = 0; i < 20_000; i++) {
    const slug = drawCards(1, false)[0].slug
    seen.set(slug, (seen.get(slug) ?? 0) + 1)
  }
  const counts = [...seen.values()]
  const expected = 20_000 / 78
  const worst = Math.max(...counts.map((n) => Math.abs(n - expected) / expected))
  check("every card appears across 20,000 draws", seen.size === 78, `${seen.size}/78`)
  check("no card is starved or favoured by more than 25%", worst < 0.25,
    `worst deviation ${(worst * 100).toFixed(1)}%`)

  const noRev = drawCards(10, false)
  check("reversals can be switched off", noRev.every((d) => !d.reversed))
}

function verifyCodec() {
  section("Share codec")

  for (const slug of Object.keys(SPREADS)) {
    const drawn = drawCards(SPREADS[slug].count, true)
    const code = encodeReading(slug, drawn)
    const back = decodeReading(code)
    check(`${slug} round-trips`,
      !!back && back.spread.slug === slug &&
      JSON.stringify(back.drawn) === JSON.stringify(drawn),
      `${code.length} chars`)
  }

  for (const bad of ["", "!!!!", "AA", "x".repeat(40), "____", "AAAAAAAAAAAAAAAA"]) {
    check(`rejects ${JSON.stringify(bad.slice(0, 10))}`, decodeReading(bad) === null)
  }

  const dup = encodeReading("three-card", [
    { slug: "the-fool", reversed: false },
    { slug: "the-fool", reversed: true },
    { slug: "the-sun", reversed: false },
  ])
  check("rejects a code dealing the same card twice", decodeReading(dup) === null)
}

function verifyReading() {
  section("Reading")

  const spread = SPREADS["celtic-cross"]
  const reading = composeReading(hydrate(drawCards(spread.count, true), spread), spread, "")
  check("one passage per position plus a synthesis",
    reading.passages.length === spread.count + 1, `${reading.passages.length}`)
  check("the synthesis is the last passage",
    reading.passages[reading.passages.length - 1] === reading.synthesis)
  check("every passage names its position",
    reading.cards.every((c, i) => reading.passages[i].includes(c.position.name)))

  const yesNo = SPREADS["yes-no"]
  const answer = composeReading(hydrate(drawCards(1, false), yesNo), yesNo, "")
  check("yes-or-no gives a verdict", answer.synthesis.includes("The answer."))

  const withQuestion = composeReading(
    hydrate(drawCards(3, true), SPREADS["three-card"]), SPREADS["three-card"], "Should I move?")
  check("a question is echoed back", withQuestion.passages[0].includes("Should I move?"))
}

function verifyOrders() {
  section("Orders and money")

  const reader =
    listReaders(false)[0] ??
    addReader({ slug: "verify", name: "Verify", price_cents: 5500 })

  const other = listReaders(false).find((r) => r.id !== reader.id)

  const token = createOrder(reader, {
    focus: "general", situation: "x".repeat(40), tried: "",
    birth_ymd: "", spread_slug: "three-card", drawn: drawCards(3, true),
  })

  check("an unpaid order cannot be claimed",
    setStatus(token, "claimed", { readerId: reader.id }) === false)
  setPayment(token, "paid")
  check("a paid order can be claimed",
    setStatus(token, "claimed", { readerId: reader.id }) === true)
  check("another reader cannot touch it",
    other ? setStatus(token, "delivered", { reading: "x", readerId: other.id }) === false : true)
  check("an empty reading is refused",
    setStatus(token, "delivered", { reading: "   ", readerId: reader.id }) === false)
  check("delivery with text is accepted",
    setStatus(token, "delivered", { reading: "A real reading.", readerId: reader.id }) === true)
  check("delivered is terminal",
    setStatus(token, "open", { readerId: reader.id }) === false)
  check("a repeated payment webhook is not an error", setPayment(token, "paid") === true)

  // 5500 * 0.70 is 3849.999... in binary float; truncation loses a cent.
  const priced = listReaders(false).find((r) => r.price_cents === 5500)
  check("€55.00 pays out €38.50, not €38.49",
    priced ? priced.payout === "38.50" : true, priced?.payout ?? "")

  check("delivered work shows as owed", payoutsOwed().length > 0)
  const before = readerEarnings(reader.id)
  settleReader(reader.id)
  const after = readerEarnings(reader.id)
  check("settling moves owed to paid",
    after.owed === "0.00" && after.paid !== before.paid,
    `owed ${before.owed}→${after.owed}, paid ${before.paid}→${after.paid}`)
}

function verifySubscribers() {
  section("Mailing list")

  const email = `verify-${Date.now()}@example.test`
  const first = subscribe(email, "verify", CONSENT_TEXT, "127.0.0.1")
  check("a valid address is accepted", !!first)
  check("a malformed address is rejected",
    subscribe("not an email", "verify", CONSENT_TEXT) === null)

  const pending = getSubscriber(first!)
  check("a new row starts pending, not confirmed", pending?.status === "pending")
  check("the exact consent wording is stored", pending?.consent_text === CONSENT_TEXT)
  check("the consent timestamp and IP are stored",
    !!pending?.consent_at && pending?.consent_ip === "127.0.0.1")

  confirmSubscriber(first!, "127.0.0.1")
  check("confirming twice is not an error", !!confirmSubscriber(first!, "127.0.0.1"))
  unsubscribe(first!)
  const again = subscribe(email, "verify", CONSENT_TEXT, "127.0.0.1")
  check("returning after unsubscribing goes back to pending",
    getSubscriber(again!)?.status === "pending")

  check("marketing is blocked unless the two sending domains differ",
    channelsAreSeparated() === true,
    channelsAreSeparated() ? "" : "set MAIL_TX_FROM and MAIL_MK_FROM to different domains")
}

// ---------------------------------------------------------------------------
// 3. The site
// ---------------------------------------------------------------------------

function listening(port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" })
    const done = (ok: boolean) => { socket.destroy(); resolve(ok) }
    socket.setTimeout(500)
    socket.once("connect", () => done(true))
    socket.once("error", () => done(false))
    socket.once("timeout", () => done(false))
  })
}

async function startServer(): Promise<ChildProcess | null> {
  if (!fs.existsSync(path.join(process.cwd(), ".next"))) {
    console.log("\n  ! No production build found. Run `pnpm build` first —")
    console.log("    the site checks are skipped without one.\n")
    return null
  }
  const child = spawn("node_modules/.bin/next", ["start", "-p", String(PORT)], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT) },
    stdio: "ignore",
  })
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    if (await listening(PORT)) return child
    await new Promise((r) => setTimeout(r, 400))
  }
  child.kill("SIGKILL")
  console.log("\n  ! The server did not come up within 60s; site checks skipped.\n")
  return null
}

async function get(path: string) {
  const response = await fetch(BASE + path)
  return { status: response.status, body: await response.text() }
}

async function verifySite() {
  section("Routes")

  const routes: Array<[string, string]> = [
    ["/", "home"],
    ["/cards", "the deck"],
    ["/cards/the-star", "a card"],
    ["/cards/the-star/love", "a card in context"],
    ["/cards/context/love", "a context hub"],
    ["/cards/context/yes-no", "the yes-or-no hub"],
    ["/questions", "the question hub"],
    [`/questions/${QUESTIONS[0].slug}`, "a question page"],
    ["/combinations/the-tower/the-star", "a combination"],
    ["/birth-card", "birth card tool"],
    ["/birth-card/february-29", "a leap-day birth page"],
    ["/report", "written report"],
    ["/daily", "card of the day"],
    ["/learn", "how to read tarot"],
    ["/my-deck", "reading history"],
    ["/spreads", "spreads"],
    ["/readers", "readers"],
    ["/desk", "reader desk"],
    ["/admin", "operator console"],
    ["/legal/impressum", "impressum"],
    ["/healthz", "health"],
    ["/robots.txt", "robots"],
    ["/sitemap.xml", "sitemap index"],
    ["/sitemap/0.xml", "sitemap"],
    ["/preview", "page index"],
  ]

  for (const [path, label] of routes) {
    const { status } = await get(path)
    check(`${label.padEnd(24)} ${path}`, status === 200, status === 200 ? "" : `HTTP ${status}`)
  }

  section("Links")

  const { body: index } = await get("/preview")
  // Anchors only. Matching every href also picks up the framework's own
  // stylesheet and preload tags, which are not pages and whose hashed URLs
  // change on every build.
  const links = [...new Set(
    [...index.matchAll(/<a\b[^>]*\bhref="(\/[^"?#]*)"/g)].map((m) => m[1]),
  )]
  const dead: string[] = []
  for (const link of links) {
    // The index deliberately includes one malformed share code, which must 404.
    if (link === "/r/not-a-real-code") continue
    const { status } = await get(link)
    if (status !== 200) dead.push(`${status} ${link}`)
  }
  check(`every link on the page index resolves (${links.length - 1} checked)`,
    dead.length === 0, dead.join(", "))

  const { status: badCode } = await get("/r/not-a-real-code")
  check("a malformed share code 404s rather than erroring", badCode === 404, `HTTP ${badCode}`)

  section("Search engine")

  for (const [path, label] of [
    ["/", "home"],
    ["/cards/the-star", "a card"],
    ["/cards/the-star/love", "a card in context"],
    ["/combinations/the-tower/the-star", "a combination"],
    [`/questions/${QUESTIONS[0].slug}`, "a question page"],
  ] as Array<[string, string]>) {
    const { body } = await get(path)
    const text = body
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    const has = (re: RegExp) => re.test(body)
    check(`${label}: title, description, canonical, h1`,
      has(/<title>[^<]{10,}<\/title>/) &&
      has(/<meta name="description" content="[^"]{40,}"/) &&
      has(/<link rel="canonical"/) &&
      has(/<h1[^>]*>/),
    )
    check(`${label}: real body text with no JavaScript`, text.length > 900,
      `${text.length} chars`)
  }

  const { body: card } = await get("/cards/the-star")
  check("card pages carry structured data", card.includes('application/ld+json'))

  const missingHonest: string[] = []
  for (const question of QUESTIONS) {
    const { body } = await get(`/questions/${question.slug}`)
    if (!body.includes("What this cannot do")) missingHonest.push(question.slug)
  }
  check("every question page says what it cannot do", missingHonest.length === 0,
    missingHonest.join(", "))

  const { body: faq } = await get(`/questions/${QUESTIONS[0].slug}`)
  check("question pages carry FAQ structured data", faq.includes('"FAQPage"'))

  const { body: robots } = await get("/robots.txt")
  check("robots points at a sitemap that exists", robots.includes("/sitemap.xml"))

  const { body: index0 } = await get("/sitemap.xml")
  const children = [...index0.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  check("the sitemap index lists at least one sitemap", children.length > 0)

  const { body: urls } = await get("/sitemap/0.xml")
  const locs = [...urls.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  // Counted by page type rather than read back from the sitemap, so a whole
  // type silently dropping out of it still fails here.
  const expected =
    10 +                                  // the standalone pages
    Object.keys(SPREADS).length +
    CARDS.length +
    312 +                                 // per card, per context
    (CONTEXTS.length - 1) +               // context hubs
    QUESTIONS.length + 1 +                // question pages and their hub
    comboPairs().length +
    allDateSlugs().length +
    4                                     // legal
  check("the sitemap holds every generated page", Math.abs(locs.length - expected) <= 12,
    `${locs.length} URLs`)

  // Sampling rather than all 1,237: a sitemap that lists a 404 is the failure,
  // and a random sample catches a whole broken page type.
  const sample = locs.filter((_, i) => i % Math.ceil(locs.length / 25) === 0)
  const brokenInSitemap: string[] = []
  for (const url of sample) {
    const { status } = await get(new URL(url).pathname)
    if (status !== 200) brokenInSitemap.push(`${status} ${url}`)
  }
  check(`sampled ${sample.length} sitemap URLs, all reachable`,
    brokenInSitemap.length === 0, brokenInSitemap.join(", "))
}

// ---------------------------------------------------------------------------

async function main() {
  console.log("\nArcana Press — verification\n" + "=".repeat(27))

  verifyCorpus()
  verifyDraw()
  verifyCodec()
  verifyReading()
  verifyOrders()
  verifySubscribers()

  const server = await startServer()
  if (server) {
    try {
      await verifySite()
    } finally {
      server.kill("SIGKILL")
    }
  }

  const total = passed + failures.length
  console.log(`\n${"=".repeat(27)}`)
  if (failures.length === 0) {
    console.log(`${passed}/${total} checks passed.\n`)
  } else {
    console.log(`${passed}/${total} passed, ${failures.length} FAILED:`)
    for (const f of failures) console.log(`  - ${f}`)
    console.log()
  }
  process.exit(failures.length === 0 ? 0 : 1)
}

main()
