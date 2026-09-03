import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SITE, canonical } from "@/lib/site"

/** Operator identity. German law (§5 DDG) requires an Impressum that is
 *  reachable in one click and names a real address and registration -- the
 *  Flask build had no Impressum route at all, which is a live compliance gap.
 *  MISSING markers are rendered visibly on purpose so the gap cannot ship
 *  quietly. Fill them from the env before going live. */
const OPERATOR = {
  legalName: process.env.OPERATOR_LEGAL_NAME ?? "",
  address: process.env.OPERATOR_ADDRESS ?? "",
  country: process.env.OPERATOR_COUNTRY ?? "",
  regNumber: process.env.OPERATOR_REG_NUMBER ?? "",
  vat: process.env.OPERATOR_VAT ?? "",
  email: process.env.OPERATOR_EMAIL ?? "",
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || <strong className="missing">MISSING — required before launch</strong>}</dd>
    </div>
  )
}

const PAGES: Record<string, { title: string; body: React.ReactNode }> = {
  impressum: {
    title: "Impressum",
    body: (
      <>
        <p>
          Information required under §5 DDG (formerly §5 TMG) and §18 MStV.
        </p>
        <dl className="facts">
          <Field label="Operator" value={OPERATOR.legalName} />
          <Field label="Address" value={OPERATOR.address} />
          <Field label="Country" value={OPERATOR.country} />
          <Field label="Register number" value={OPERATOR.regNumber} />
          <Field label="VAT ID (§27a UStG)" value={OPERATOR.vat} />
          <Field label="Contact" value={OPERATOR.email} />
        </dl>
        <p>
          Responsible for editorial content under §18(2) MStV: the operator named
          above, at the address given.
        </p>
        <h2>Online dispute resolution</h2>
        <p>
          The European Commission provides a platform for online dispute
          resolution at{" "}
          <a href="https://ec.europa.eu/consumers/odr/">ec.europa.eu/consumers/odr</a>.
          We are neither obliged nor willing to participate in dispute resolution
          proceedings before a consumer arbitration board.
        </p>
      </>
    ),
  },
  disclaimer: {
    title: "Disclaimer",
    body: (
      <>
        <p>
          {SITE.name} is for entertainment and self-reflection. A tarot reading is
          a structured way of looking at a situation you are already in. It is not
          advice, and it does not predict what will happen.
        </p>
        <p>
          Nothing on this site is medical, legal, financial or psychological
          advice. If you need any of those, talk to someone qualified to give it.
          If you are in crisis, contact your local emergency services.
        </p>
        <p>You must be 18 or older to use this site.</p>
        <h2>How the cards are drawn</h2>
        <p>
          Cards are drawn without replacement using your device&rsquo;s
          cryptographic random number generator, not a seeded shuffle and not a
          predetermined result. Reversals are drawn the same way when you enable
          them.
        </p>
      </>
    ),
  },
  privacy: {
    title: "Privacy",
    body: (
      <>
        <p>
          Readings are generated in your browser and are not sent to us or stored
          on our servers. We do not require an account to read the cards.
        </p>
        <h2>What we store</h2>
        <p>
          Your theme preference is kept in your browser&rsquo;s local storage and
          never leaves your device. If you subscribe to the daily card, we store
          your email address together with the evidence of your consent: the
          timestamp, the IP address the confirmation came from, and a snapshot of
          the exact wording you agreed to. That record exists because German law
          (§7 UWG) puts the burden of proving consent on us.
        </p>
        <h2>Unsubscribing</h2>
        <p>
          Every message carries a one-click unsubscribe (RFC 8058) and a link in
          the body. Unsubscribing removes you from sending immediately; the
          consent record is retained only as long as needed to demonstrate the
          subscription was lawful, then deleted.
        </p>
        <h2>Controller</h2>
        <dl className="facts">
          <Field label="Controller" value={OPERATOR.legalName} />
          <Field label="Address" value={OPERATOR.address} />
          <Field label="Contact" value={OPERATOR.email} />
        </dl>
      </>
    ),
  },
  terms: {
    title: "Terms of Use",
    body: (
      <>
        <p>
          By using {SITE.name} you agree to these terms. If you do not, please do
          not use the site.
        </p>
        <h2>The service</h2>
        <p>
          Free readings are provided as-is, for entertainment. Paid readings
          written by a person are a separate service with their own delivery time
          stated at the point of purchase.
        </p>
        <h2>Refunds</h2>
        <p>
          A paid reading that has not yet been delivered can be cancelled for a
          full refund. Once delivered, a reading is a completed digital service.
          EU consumers waive the 14-day withdrawal right at checkout for
          immediate delivery, which is stated before payment.
        </p>
        <h2>Liability</h2>
        <p>
          Nothing here is advice and no outcome is promised. We are not liable for
          decisions taken on the basis of a reading.
        </p>
      </>
    ),
  },
}

type Params = { params: Promise<{ page: string }> }

export function generateStaticParams() {
  return Object.keys(PAGES).map((page) => ({ page }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { page } = await params
  const entry = PAGES[page]
  if (!entry) return {}
  return {
    title: entry.title,
    description: `${entry.title} for ${SITE.name}.`,
    alternates: { canonical: canonical(`/legal/${page}`) },
    // Legal boilerplate is not what we want ranking for.
    robots: { index: false, follow: true },
  }
}

export default async function LegalPage({ params }: Params) {
  const { page } = await params
  const entry = PAGES[page]
  if (!entry) notFound()
  return (
    <article className="prose-wide">
      <p className="eyebrow">Legal</p>
      <h1>{entry.title}</h1>
      {entry.body}
    </article>
  )
}
