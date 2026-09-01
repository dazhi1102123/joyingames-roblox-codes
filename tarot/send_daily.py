#!/usr/bin/env python3
"""Send the daily card to confirmed subscribers.

    python send_daily.py                  # dry run: renders, sends nothing
    python send_daily.py --send           # actually sends
    python send_daily.py --send --limit 50

Dry run is the default on purpose. A campaign script whose no-argument
behaviour is "mail everyone" is one shell-history arrow-up away from a mistake
that cannot be undone.

What this will not do:

  * send to anyone not confirmed — pending, unsubscribed and complained rows are
    excluded by the query, not filtered afterwards;
  * send at all when the marketing and transactional senders share a domain
    (``mailer`` refuses), because one campaign should not be able to take the
    confirmation links down with it;
  * send without a per-recipient one-click unsubscribe header;
  * abort the whole run because one address failed. Failures are counted and
    reported at the end.
"""

from __future__ import annotations

import argparse
import sys
import time
from datetime import date

import cardart
import correspondences
import mailer
import personal
import store
from app import app


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--send", action="store_true",
                    help="actually send; without it nothing leaves the machine")
    ap.add_argument("--limit", type=int, default=0, help="stop after N recipients")
    ap.add_argument("--batch", type=int, default=100, help="recipients per batch")
    ap.add_argument("--pause", type=float, default=1.0,
                    help="seconds between batches")
    args = ap.parse_args(argv)

    today = date.today()
    card, reversed_ = personal.card_of_the_day(today)
    brief = correspondences.brief_for(card, reversed_, variant=today.day)

    m = mailer.get_mailer(app.config)
    stats = store.subscriber_stats()

    print(f"Daily card — {today.isoformat()}")
    print(f"  card:        {card['name']}{' reversed' if reversed_ else ''}")
    print(f"  colour:      {brief['colour']}  stone: {brief['stone']}")
    print(f"  subscribers: {stats.get('confirmed', 0)} confirmed "
          f"of {stats.get('total', 0)} ({stats.get('pending', 0)} pending, "
          f"{stats.get('unsubscribed', 0)} unsubscribed)")
    print(f"  channel:     {m.mk['provider']} as {m.mk['from']}")

    if not m.channels_are_separated():
        print("\nREFUSING TO SEND: marketing and transactional share a sender "
              "domain.\nSet MAIL_MK_FROM to a separate domain — a campaign must "
              "not be able to\ndamage the deliverability of confirmation links.")
        return 1

    if not args.send:
        print("\nDRY RUN — nothing will be sent. Add --send to send for real.")

    sent = failed = 0
    after_id = 0
    subject = (f"{card['name']}, reversed" if reversed_ else card['name'])

    # A request context so url_for can build absolute links outside a request.
    with app.test_request_context(base_url=app.config["SITE_URL"]):
        from flask import render_template, url_for
        report_url = url_for("report_form", _external=True)

        while True:
            batch = store.confirmed_subscribers(limit=args.batch, after_id=after_id)
            if not batch:
                break
            after_id = batch[-1]["id"]
            done_ids = []

            for sub in batch:
                if args.limit and sent >= args.limit:
                    break
                unsub_url = url_for("unsubscribe_page", token=sub["token"],
                                    _external=True)
                ctx = {
                    "brief": brief, "today": today, "report_url": report_url,
                    "unsubscribe_url": unsub_url,
                    "site_name": app.config["SITE_NAME"],
                    "operator": app.config["OPERATOR"],
                    "card_svg": cardart.card_svg,
                }
                if not args.send:
                    sent += 1
                    continue
                try:
                    m.send_marketing(
                        sub["email"], subject,
                        html=render_template("emails/daily.html", **ctx),
                        text=render_template("emails/daily.txt", **ctx),
                        list_unsubscribe=unsub_url)
                    done_ids.append(sub["id"])
                    sent += 1
                except mailer.MailError as exc:
                    failed += 1
                    print(f"  ! {sub['email']}: {exc}")

            store.mark_sent(done_ids)
            if args.limit and sent >= args.limit:
                break
            if args.send and args.pause:
                time.sleep(args.pause)

    verb = "would send" if not args.send else "sent"
    print(f"\n{verb}: {sent}" + (f"   failed: {failed}" if failed else ""))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
