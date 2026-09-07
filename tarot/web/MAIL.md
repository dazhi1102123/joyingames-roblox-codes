# The list

400,000 addresses is not a list until each one has confirmed. What follows is
the machinery for getting there and for sending to them afterwards — capture,
double opt-in, and the daily send — plus the three things that block the first
real send.

## Capture

`<SubscribeForm source back />` is on `/daily`, every card page, every question
page and every reading page. One component, so every placement asks for the
same thing in the same words.

The consent box is **required and never pre-ticked**. Under GDPR Art. 7(1) the
burden of proving consent is the sender's, and a pre-ticked box is not consent.
The exact wording, the timestamp and the IP are stored on the row, so the proof
lives in the database rather than in a claim about what the form used to say —
and the label and the stored text are the same constant, so they cannot drift
apart.

`required` in the markup stops a browser, not a script, so the action re-checks
it where the record is written.

`source` is a coarse label (`daily`, `card`, `question`, `reading`) so it groups
in a query; `back` is the path a failed submission returns to, validated as a
same-site path because a form field that becomes a redirect target is an open
redirect otherwise.

## Double opt-in

Subscribing writes a **pending** row and sends exactly one message: the
confirmation. A pending row is never sent marketing. Clicking the link is what
makes it a subscriber.

Leaving takes one click. Coming back does not: an unsubscribed address that
re-subscribes returns to *pending*, never straight to confirmed.

The confirmation goes on the **transactional** channel, because a pending row
has consented to nothing yet.

## The daily send

One runner, two triggers, so they cannot drift into sending different mail — or
into one of them forgetting a guard.

```bash
pnpm daily                        # dry run: renders, counts, sends nothing
pnpm daily -- --send
pnpm daily -- --send --limit 50   # a real send to the first 50
```

```
POST /api/cron/daily?send=1
Authorization: Bearer $CRON_SECRET
```

Both default to a dry run. A send whose no-argument behaviour is "mail everyone"
is one shell-history arrow-up away from a mistake with no undo.

What the runner will not do, all of it enforced rather than remembered:

- **Send to anyone unconfirmed.** Pending, unsubscribed and complained rows are
  excluded by the query, not filtered afterwards.
- **Send when the two sending domains match.** One spam complaint against the
  daily card must not be able to take the order receipts and confirmation links
  down with it.
- **Send without a per-recipient one-click unsubscribe.**
- **Send to the same person twice in a day.** Anyone mailed since midnight UTC
  is skipped, by a clause in the same query. This is what makes a scheduler
  safe: every one of them retries on timeout, and a run cut short resumes
  instead of starting over. The Python this was ported from recorded
  `last_sent_at` and never read it, so a double trigger meant a double send with
  nothing to notice it.
- **Stop because one address failed.** Failures are counted and reported.

The cron route refuses unless `CRON_SECRET` is set — unset means off, not open,
because the other reading is how a URL that mails 400,000 people ends up
reachable by anyone who guesses the path. The key is compared in constant time,
and `GET` reports without sending so a scheduler can be pointed at it during
setup.

## Where compliance lives

In `sendMarketing`, appended to **both** the text and the HTML part, never in a
template:

- the sender's real postal address — CAN-SPAM requires one in every commercial
  message to a US recipient and gives no consent-based exception, so an
  opted-in subscriber does not waive it;
- why the message arrived, and the unsubscribe link.

Templates carry the disclaimer and nothing more. A template cannot forget what
it does not write.

Marketing is **refused** rather than sent when the postal address is unset. A
message that cannot lawfully be sent is not improved by being sent anyway.

## Both parts, always

Every message goes out as text and HTML. The text part is not a courtesy: a
message without one scores worse with spam filters, and at this list size that
is the difference between the inbox and the promotions tab.

The HTML is tables and inline styles because that is what mail clients render —
Outlook lays out with Word and Gmail strips `<style>` blocks. The card image is
the WebP already in `public/cards/rws/`, at an absolute URL. Outlook's desktop
engine does not render WebP and shows the alt text instead, which is the card's
name — the same thing every reader with images off already sees, and the
headline of the email regardless. A second set of 78 PNGs living in the
repository forever is not worth more than that.

`MAIL_PROVIDER=console` (the default) prints the message instead of sending it,
both parts, so the whole flow is walkable with no account anywhere and a
misconfigured staging box cannot mail a real person by accident.

## Before the first real send

| | |
|---|---|
| `MAIL_MK_FROM` | a **different domain** from `MAIL_TX_FROM`. Not a different address — a different domain |
| `MAIL_POSTAL_ADDRESS` | the real one. Marketing is refused without it |
| `OPERATOR_LEGAL_NAME` | the registered company name; also the site footer and the legal pages |
| `MAIL_PROVIDER=resend` + `RESEND_API_KEY` | or leave it on `console` and nothing leaves the machine |
| `CRON_SECRET` | only if the scheduled route is used |

Then warm the sending domain. 400,000 messages from a domain with no history is
the fastest way to be filtered everywhere at once, whatever the consent behind
them says.
