import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SITE, canonical } from "@/lib/site"

/** Who is behind the site.
 *
 * The operator is established outside the EU and sells to consumers in it,
 * which changes what is required. There is no §5 DDG Impressum obligation --
 * that binds providers established in Germany. What does apply is the GDPR,
 * extraterritorially, because the site offers services to people in the Union
 * (Art. 3(2)(a)); and with it Art. 27, which requires a representative
 * established in the EU, named to data subjects under Art. 13(1)(a).
 *
 * So the page below is a legal notice rather than an Impressum, and the
 * representative is a required field, not a nicety.
 *
 * MISSING markers render visibly so the gap cannot ship quietly. This is a
 * reading of the rules, not legal advice -- confirm the set with counsel for
 * the markets actually being sold into.
 */
const OPERATOR = {
  legalName: process.env.OPERATOR_LEGAL_NAME ?? "",
  address: process.env.OPERATOR_ADDRESS ?? "",
  country: process.env.OPERATOR_COUNTRY ?? "",
  regNumber: process.env.OPERATOR_REG_NUMBER ?? "",
  email: process.env.OPERATOR_EMAIL ?? "",
  /** GDPR Art. 27. Required once EU consumers are targeted. */
  euRepresentative: process.env.OPERATOR_EU_REP ?? "",
  /** UK GDPR Art. 27, if the UK is a market. */
  ukRepresentative: process.env.OPERATOR_UK_REP ?? "",
  /** CAN-SPAM: the address that goes in every marketing email. */
  postal: process.env.MAIL_POSTAL_ADDRESS ?? "",
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
  notice: {
    title: "Legal notice",
    body: (
      <>
        <p>
          Who operates this site, and who to contact about it. {SITE.name} is
          operated from outside the European Union and offers its services to
          people in it, so the GDPR applies to us regardless of where we are —
          including the requirement to name a representative inside the Union.
        </p>
        <dl className="facts">
          <Field label="Operator" value={OPERATOR.legalName} />
          <Field label="Address" value={OPERATOR.address} />
          <Field label="Country" value={OPERATOR.country} />
          <Field label="Company registration" value={OPERATOR.regNumber} />
          <Field label="Contact" value={OPERATOR.email} />
          <Field label="EU representative (GDPR Art. 27)" value={OPERATOR.euRepresentative} />
          <Field label="UK representative (UK GDPR Art. 27)" value={OPERATOR.ukRepresentative} />
          <Field label="Postal address used in email" value={OPERATOR.postal} />
        </dl>
        <p>
          Written in English. Where a translation of this page exists and differs,
          this version governs.
        </p>
        <h2>Consumer disputes</h2>
        <p>
          Contact us first at the address above — most things are resolved that
          way. Consumers in the EU can also use the European Commission&rsquo;s
          online dispute resolution platform at{" "}
          <a href="https://ec.europa.eu/consumers/odr/">ec.europa.eu/consumers/odr</a>.
          We are not obliged to participate in proceedings before a consumer
          arbitration board and do not currently do so.
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
          the exact wording you agreed to. That record exists because the GDPR
          (Art. 7(1)) puts the burden of demonstrating consent on us, and because
          the ePrivacy Directive requires prior consent before marketing email
          reaches anyone in the EU. Double opt-in is how we can show it.
        </p>
        <h2>Unsubscribing</h2>
        <p>
          Every message carries a one-click unsubscribe (RFC 8058) and a link in
          the body. Unsubscribing removes you from sending immediately; the
          consent record is retained only as long as needed to demonstrate the
          subscription was lawful, then deleted.
        </p>
        <h2>Where your data goes</h2>
        <p>
          We operate from outside the European Union, so an address you give us is
          transferred out of it. We rely on your consent for that transfer under
          Art. 49(1)(a) GDPR, which is why the subscription is opt-in and why
          withdrawing it removes the address rather than flagging it.
        </p>
        <h2>Your rights</h2>
        <p>
          You can ask for a copy of what we hold, ask us to correct it, or ask us
          to delete it, at the contact address below. An erasure request deletes
          the row — we do not keep it with a marker on it. You can also complain to
          a supervisory authority in your country.
        </p>
        <h2>Controller and representative</h2>
        <dl className="facts">
          <Field label="Controller" value={OPERATOR.legalName} />
          <Field label="Address" value={OPERATOR.address} />
          <Field label="Contact" value={OPERATOR.email} />
          <Field label="EU representative (Art. 27)" value={OPERATOR.euRepresentative} />
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
