# Arcana Press — Next.js

A React rewrite of the Flask site, in a workspace shaped so a native app can
come later without a second rewrite.

```
web/
  packages/core/   pure TypeScript: cards, reading engine, card art
  apps/site/       Next.js App Router
  (later)
  apps/mobile/     Expo — imports @arcana/core, brings its own UI
```

`packages/core` imports neither React nor Node. That is the whole point: the
reading engine has to run identically in a server component, in a browser and
in React Native, so it may not reach for any of them. React Native shares this
package with the web app; it does **not** share the UI, and expecting otherwise
is the usual way these rewrites go wrong.

## Running it

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm build && pnpm start
```

## The generated files

`packages/core/src/data.generated.ts` and `art.generated.ts` are built from the
Python, which stays the source of truth:

```bash
python gen_data.py     # 78 cards, 6 spreads, correspondences
python gen_art.py      # 78 card faces as SVG strings
```

The card corpus is 984 lines of prose and the art is 480 lines of hand-placed
geometry. Transcribing either by hand would introduce an error nobody notices
until a card page reads wrong months later, so neither is transcribed. Both
generated files are committed, so building the site never needs Python.

Re-run both after editing `../tarot_data.py`, `../correspondences.py` or
`../cardart.py`.

## Why the SEO holds up

Every content route is prerendered at build time — 96 static HTML files, no JS
execution needed to see the text. Verified, not assumed:

| | |
|---|---|
| `/cards/the-fool` | 2,446 characters of body text in the raw HTML |
| `<title>`, description, canonical | present on every route |
| `sitemap.xml` | 91 URLs, generated from the corpus |
| JSON-LD | `Article` on every card page |

The one route that is not prerendered content is the draw itself, which is
client-side on purpose: every visitor must get a different spread, so baking one
into the HTML would be wrong, and drawing in the browser keeps the page fully
cacheable at the edge.

## Known gap

`/cards` ships 455 KB of HTML because all 78 faces inline at once — worse than
the Flask build's 191 KB, since the RSC payload duplicates the markup. Paginate
or lazy-load it before launch. This is a page-design problem, not a framework
one; it was fat in Flask too.
