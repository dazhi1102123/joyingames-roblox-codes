#!/usr/bin/env python3
"""Put something in the queue so the operator and reader views are not empty.

An empty admin page and an empty desk tell you nothing about whether they work.
This creates one order at each stage of the flow — delivered, paid and waiting,
and unpaid — plus a few subscribers.

Idempotent: does nothing if orders already exist.
"""

import io
import contextlib
import sys

import store


DELIVERED = (
    "**Situation — Knight of Pentacles.** You already know this job. That is the "
    "difficulty: nothing is wrong with it, which makes leaving feel unjustifiable "
    "rather than merely hard.\n\n"
    "**Action — The Fool, reversed.** A leap you keep rehearsing. Two pros and cons "
    "lists is not deliberation, it is a way of not deciding — the list will never "
    "resolve because the thing you are weighing is not on it.\n\n"
    "**Outcome — Judgement, reversed.** Not a warning about the new role. A "
    "description of what happens if you keep asking other people to settle this.\n\n"
    "One thing to try: write down what would have to be true for you to stay three "
    "more years. If you cannot finish the sentence, you have your answer."
)


def main():
    store.init_db()
    with store.connect() as c:
        if c.execute("SELECT COUNT(*) FROM orders").fetchone()[0]:
            print("  = orders already present, skipped")
            return 0

    from app import app
    c = app.test_client()
    admin_key = app.config.get("ADMIN_KEY")
    maren = store.get_reader("maren-voss")
    theo = store.get_reader("theo-brandt")
    if not maren or not theo:
        print("  ! run seed_readers.py first")
        return 1

    def order(slug, focus, situation, tried="", birth=None):
        data = {"focus": focus, "situation": situation, "tried": tried}
        if birth:
            data.update(zip(("bm", "bd", "by"), birth))
        r = c.post(f"/readers/{slug}/request", data=data)
        return r.headers["Location"].rsplit("/", 1)[-1]

    # 1. one delivered, so the customer view and the payout ledger have content
    done = order("maren-voss", "career",
                 "I've been offered a role at a smaller company. Better title, less "
                 "money, and I can't tell if I'm running toward it or away.",
                 "Made a pros and cons list twice. Asked two friends who disagreed.",
                 birth=("1", "18", "2000"))
    if admin_key:
        c.post("/admin", data={"key": admin_key})
        c.post(f"/admin/{done}/paid")
    c.post("/desk", data={"key": maren["access_key"]})
    c.post(f"/desk/{done}/claim")
    c.post(f"/desk/{done}/deliver", data={"reading": DELIVERED})

    # 2. paid and waiting, so the desk queue has something to claim
    waiting = order("maren-voss", "love",
                    "We keep having the same argument every few weeks and I can't "
                    "tell if it's one problem or five.")
    if admin_key:
        c.post("/admin", data={"key": admin_key})
        c.post(f"/admin/{waiting}/paid")

    # 3. unpaid, so /admin has something to settle
    order("theo-brandt", "money",
          "Freelance income swings badly and I never know what I can actually spend.")

    # subscribers, so the daily send has recipients. The confirmation emails
    # would otherwise print three times over this script's output.
    with contextlib.redirect_stdout(io.StringIO()):
        for email in ("ada@example.com", "bo@example.com", "cy@example.com"):
            store.confirm_subscriber(store.subscribe(email, "seed", "consent", "127.0.0.1"))
        store.subscribe("pending@example.com", "seed", "consent", "127.0.0.1")

    print("  + 1 delivered, 1 waiting, 1 unpaid order")
    print("  + 3 confirmed subscribers, 1 pending")
    print(f"    delivered order: /order/{done}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
