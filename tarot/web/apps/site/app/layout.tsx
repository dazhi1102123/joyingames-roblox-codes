import type { Metadata } from "next"
import { CONTEXTS, SPREADS } from "@arcana/core"
import { SITE, canonical } from "@/lib/site"
import { ThemeToggle } from "./theme-toggle"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    // Page titles fill the %s. Set once here rather than repeated per route.
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_US",
    url: SITE.url,
  },
  robots: { index: true, follow: true },
}

const NAV = [
  { href: "/", label: "Reading" },
  { href: "/cards", label: "The Deck" },
  { href: "/spreads", label: "Spreads" },
  { href: "/report", label: "Report" },
  { href: "/daily", label: "Today" },
  { href: "/learn", label: "Learn" },
  { href: "/readers", label: "Readers" },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={SITE.locale} suppressHydrationWarning>
      <head>
        {/* Applied before first paint, so a dark-mode visitor never sees a
            light flash. It has to be inline and blocking for that reason. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body>
        <header className="masthead">
          <a className="wordmark" href="/">
            <span className="mark" aria-hidden="true" />
            {SITE.name}
          </a>
          <nav>
            {NAV.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <ThemeToggle />
        </header>

        <main>{children}</main>

        <footer className="footer">
          <div className="cols">
            <div>
              <h4>Readings</h4>
              {Object.values(SPREADS).map((s) => (
                <a key={s.slug} href={`/reading/${s.slug}`}>
                  {s.name}
                </a>
              ))}
            </div>
            <div>
              <h4>The Deck</h4>
              <a href="/cards">All 78 cards</a>
              <a href="/spreads">Spreads explained</a>
              <a href="/learn">How to read tarot</a>
              <a href="/daily">Today&rsquo;s card</a>
              <a href="/birth-card">Find your birth card</a>
              <a href="/my-deck">Your reading history</a>
            </div>
            <div>
              <h4>By question</h4>
              {CONTEXTS.filter((c) => c.slug !== "general").map((c) => (
                <a key={c.slug} href={`/cards/context/${c.slug}`}>
                  {c.label}
                </a>
              ))}
            </div>
            <div>
              <h4>Site</h4>
              <a href="/legal/disclaimer">Disclaimer</a>
              <a href="/legal/privacy">Privacy</a>
              <a href="/legal/terms">Terms</a>
              <a href="/legal/impressum">Impressum</a>
            </div>
          </div>
          <p className="fineprint">
            {SITE.name} is for entertainment and self-reflection only. Readings are
            not advice — medical, legal, financial or otherwise — and nothing here
            predicts the future. You must be 18 or older to use this site. Cards are
            drawn with your device&rsquo;s cryptographic random number generator.
            <br />© 2026 {SITE.operator}. Card artwork: Rider-Waite-Smith, 1909,
            illustrated by Pamela Colman Smith — public domain.
          </p>
        </footer>
      </body>
    </html>
  )
}
