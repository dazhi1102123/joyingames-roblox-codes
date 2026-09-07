import { CONSENT_TEXT } from "@/lib/subscribers"
import { subscribeAction } from "@/lib/actions"

/** The email capture, in one component so every placement asks the same thing.
 *
 * Double opt-in: this creates a pending row and sends one confirmation. Nobody
 * is on the list until they click it, which is why the button does not promise
 * anything more than a confirmation.
 *
 * The consent box is required and is not pre-ticked. Under GDPR Art. 7(1) the
 * burden of proving consent is ours, and a pre-ticked box is not consent --
 * the exact wording, the timestamp and the IP are stored with the row so the
 * proof exists in the database rather than in a claim about the form. Changing
 * the label here without changing what is stored would break that, which is
 * why both read the same constant.
 *
 * `source` says which kind of page it came from -- worth having when a list of
 * 400,000 needs to be argued for one address at a time, and kept coarse so it
 * groups. `back` is the path a failure returns to, which is a different job
 * and so a different field.
 */
export function SubscribeForm({
  source,
  back,
  heading = "The daily card, by email",
  blurb = "One card each morning, read the way the site reads them. No sales copy, no course, no reading you did not ask for.",
}: {
  source: string
  back: string
  heading?: string
  blurb?: string
}) {
  return (
    <aside className="cta subscribe">
      <h2 className="label">{heading}</h2>
      <p>{blurb}</p>
      <form action={subscribeAction} className="subscribe-form">
        <input type="hidden" name="source" value={source} />
        <input type="hidden" name="back" value={back} />
        <label className="sr-only" htmlFor={`sub-${source}`}>
          Email address
        </label>
        <input
          id={`sub-${source}`}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <label className="consent">
          <input type="checkbox" name="consent" value="yes" required />
          <span>{CONSENT_TEXT}</span>
        </label>
        <button className="btn primary" type="submit">
          Send me the confirmation
        </button>
      </form>
      <p className="note">
        We send one message to check the address is yours. Nothing else follows
        unless you click it. <a href="/legal/privacy">What we store, and why</a>.
      </p>
    </aside>
  )
}
