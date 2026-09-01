"""Email, split into two channels that must never touch each other.

The split is the whole point of this module. Transactional mail (a confirmation
link, a delivered reading) and marketing mail (the daily brief) have opposite
risk profiles:

  * Transactional goes to people who just acted, gets near-zero complaints, and
    is *load-bearing* — if it stops arriving, the product stops working.
  * Marketing goes to a list, attracts complaints no matter how good it is, and
    is survivable if it pauses.

Sending marketing from the transactional sender means one bad campaign takes the
password resets down with it. So the two channels have separate credentials,
separate from-addresses, and separate domains — and ``send_marketing`` refuses to
run if those domains match. That check is here rather than in a runbook because
a runbook does not stop a tired person at 2am.

Providers: ``console`` (prints, the default), ``smtp`` (works with anything),
``resend`` (what artisanlane already uses).
"""

from __future__ import annotations

import json
import os
import smtplib
import ssl
import sys
import urllib.error
import urllib.request
from email.message import EmailMessage
from email.utils import formataddr, parseaddr

TRANSACTIONAL = "transactional"
MARKETING = "marketing"


class MailError(RuntimeError):
    pass


def _domain(address):
    _, addr = parseaddr(address or "")
    return addr.rpartition("@")[2].lower()


# ---------------------------------------------------------------------------
# Providers
# ---------------------------------------------------------------------------

class ConsoleProvider:
    """Prints instead of sending. The default, so nothing leaks by accident."""

    name = "console"

    def __init__(self, settings):
        self.settings = settings

    def send(self, message):
        print("-" * 70)
        print(f"[{message['channel']}] {message['from']} -> {message['to']}")
        print(f"subject: {message['subject']}")
        for k, v in (message.get("headers") or {}).items():
            print(f"{k}: {v}")
        print("-" * 70)
        print(message.get("text") or "(html only)")
        print("-" * 70)
        return f"console:{abs(hash(message['to'] + message['subject']))}"


class SMTPProvider:
    """Any ESP, over SMTP. The portable option."""

    name = "smtp"

    def __init__(self, settings):
        self.host = settings.get("host", "")
        self.port = int(settings.get("port") or 587)
        self.user = settings.get("user", "")
        self.password = settings.get("password", "")
        if not self.host:
            raise MailError("SMTP host is not configured for this channel")

    def send(self, message):
        msg = EmailMessage()
        msg["From"] = message["from"]
        msg["To"] = message["to"]
        msg["Subject"] = message["subject"]
        for k, v in (message.get("headers") or {}).items():
            msg[k] = v
        msg.set_content(message.get("text") or "")
        if message.get("html"):
            msg.add_alternative(message["html"], subtype="html")

        try:
            with smtplib.SMTP(self.host, self.port, timeout=30) as s:
                s.starttls(context=ssl.create_default_context())
                if self.user:
                    s.login(self.user, self.password)
                s.send_message(msg)
        except (smtplib.SMTPException, OSError) as exc:
            raise MailError(f"SMTP send failed: {exc}") from exc
        return msg.get("Message-ID", "smtp:sent")


class ResendProvider:
    """Resend's HTTP API."""

    name = "resend"
    ENDPOINT = "https://api.resend.com/emails"

    def __init__(self, settings):
        self.api_key = settings.get("api_key", "")
        if not self.api_key:
            raise MailError("Resend API key is not configured for this channel")

    def send(self, message):
        payload = {
            "from": message["from"],
            "to": [message["to"]],
            "subject": message["subject"],
            "text": message.get("text") or "",
        }
        if message.get("html"):
            payload["html"] = message["html"]
        if message.get("headers"):
            payload["headers"] = message["headers"]

        req = urllib.request.Request(
            self.ENDPOINT,
            data=json.dumps(payload).encode(),
            headers={"Authorization": f"Bearer {self.api_key}",
                     "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return (json.loads(resp.read().decode() or "{}") or {}).get("id", "resend:sent")
        except urllib.error.HTTPError as exc:
            raise MailError(f"Resend HTTP {exc.code}: "
                            f"{exc.read().decode(errors='replace')[:300]}") from exc
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            raise MailError(f"Resend unreachable: {exc}") from exc


PROVIDERS = {"console": ConsoleProvider, "smtp": SMTPProvider, "resend": ResendProvider}


# ---------------------------------------------------------------------------
# Channels
# ---------------------------------------------------------------------------

def _channel_settings(config, channel):
    p = "MAIL_TX_" if channel == TRANSACTIONAL else "MAIL_MK_"
    return {
        "provider": (config.get(p + "PROVIDER") or "console").strip().lower(),
        "from": config.get(p + "FROM") or f"{channel}@localhost",
        "reply_to": config.get(p + "REPLY_TO") or "",
        "api_key": config.get(p + "API_KEY") or "",
        "host": config.get(p + "SMTP_HOST") or "",
        "port": config.get(p + "SMTP_PORT") or "",
        "user": config.get(p + "SMTP_USER") or "",
        "password": config.get(p + "SMTP_PASSWORD") or "",
    }


class Mailer:
    def __init__(self, config):
        self.config = config
        self.tx = _channel_settings(config, TRANSACTIONAL)
        self.mk = _channel_settings(config, MARKETING)

    # -- the guard ---------------------------------------------------------

    def channels_are_separated(self):
        """True when marketing cannot damage transactional deliverability.

        Same domain means one campaign's complaint rate is the reputation your
        confirmation links depend on.
        """
        tx, mk = _domain(self.tx["from"]), _domain(self.mk["from"])
        return bool(tx) and bool(mk) and tx != mk

    def _provider(self, settings):
        name = settings["provider"]
        if name not in PROVIDERS:
            raise MailError(f"Unknown mail provider {name!r}. "
                            f"Known: {', '.join(sorted(PROVIDERS))}")
        return PROVIDERS[name](settings)

    def _send(self, settings, channel, to, subject, html, text, headers=None):
        if "@" not in (to or ""):
            raise MailError("refusing to send to a malformed address")
        hdrs = dict(headers or {})
        if settings["reply_to"]:
            hdrs.setdefault("Reply-To", settings["reply_to"])
        return self._provider(settings).send({
            "channel": channel, "from": settings["from"], "to": to,
            "subject": subject, "html": html, "text": text, "headers": hdrs,
        })

    # -- the two channels --------------------------------------------------

    def send_transactional(self, to, subject, html="", text="", headers=None):
        return self._send(self.tx, TRANSACTIONAL, to, subject, html, text, headers)

    def send_marketing(self, to, subject, html="", text="", headers=None,
                       list_unsubscribe=None):
        """Marketing send. Refuses without separation and without an opt-out.

        RFC 8058 one-click unsubscribe is not optional: Gmail, Yahoo and
        Microsoft all require it of bulk senders, and a missing header is enough
        to get filtered regardless of content.
        """
        if not self.channels_are_separated():
            raise MailError(
                f"marketing and transactional share the domain "
                f"'{_domain(self.tx['from'])}'. Sending campaigns from the "
                f"transactional sender risks the mail the product depends on. "
                f"Set MAIL_MK_FROM to a separate domain."
            )
        if not list_unsubscribe:
            raise MailError("marketing mail requires a one-click unsubscribe URL")

        hdrs = dict(headers or {})
        hdrs["List-Unsubscribe"] = f"<{list_unsubscribe}>"
        hdrs["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"
        return self._send(self.mk, MARKETING, to, subject, html, text, hdrs)


def get_mailer(config):
    return Mailer(config)


# ---------------------------------------------------------------------------
# Check
# ---------------------------------------------------------------------------

def check(config=None):
    config = config or dict(os.environ)
    m = Mailer(config)
    print("Mail configuration\n" + "=" * 62)
    for label, s in (("transactional", m.tx), ("marketing", m.mk)):
        print(f"{label:<14} provider={s['provider']:<8} from={s['from']}")
    sep = m.channels_are_separated()
    print("=" * 62)
    print(f"channel separation: {'OK' if sep else 'FAILED'}"
          f"  (tx={_domain(m.tx['from'])!r} mk={_domain(m.mk['from'])!r})")
    if not sep:
        print("  Marketing sends are blocked until these are different domains.")

    to = config.get("MAIL_CHECK_TO")
    if not to:
        print("\nSet MAIL_CHECK_TO=you@example.com to send a real test.")
        return 0 if sep else 1
    try:
        ref = m.send_transactional(to, "Arcana Press — transactional test",
                                   text="If this arrived, the transactional "
                                        "channel works.")
        print(f"\ntransactional -> {ref}")
        if sep:
            ref = m.send_marketing(
                to, "Arcana Press — marketing test",
                text="If this arrived, the marketing channel works.",
                list_unsubscribe=(config.get("PUBLIC_SITE_URL", "") + "/unsubscribe/test"))
            print(f"marketing     -> {ref}")
    except MailError as exc:
        print(f"\nFAILED: {exc}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(check())
