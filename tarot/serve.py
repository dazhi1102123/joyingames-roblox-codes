#!/usr/bin/env python3
"""Serve the site, and open a browser once the port is actually answering.

    python serve.py [port] [--no-reload]

Every launcher goes through here. Opening a browser before the port is
listening shows a connection error on the first load, which reads as "it did
not work" even though the server is a second away from being up.
"""

from __future__ import annotations

import os
import socket
import sys
import threading
import time
import webbrowser


def open_when_ready(port, timeout=30):
    deadline = time.time() + timeout
    while time.time() < deadline:
        with socket.socket() as probe:
            probe.settimeout(0.5)
            if probe.connect_ex(("127.0.0.1", port)) == 0:
                try:
                    webbrowser.open("http://localhost:%d" % port)
                except Exception:
                    # A machine with no browser configured is not a reason to
                    # refuse to serve.
                    pass
                return
        time.sleep(0.3)


def main():
    args = sys.argv[1:]
    reload_on_edit = "--no-reload" not in args
    ports = [a for a in args if a.isdigit()]
    port = int(ports[0]) if ports else 5000

    # With the reloader on, this file runs twice: once in the supervisor and
    # once in the child that actually serves. Only the child should open a tab.
    serving = not reload_on_edit or os.environ.get("WERKZEUG_RUN_MAIN") == "true"
    if serving:
        threading.Thread(target=open_when_ready, args=(port,), daemon=True).start()

    from app import app
    app.run(
        host="127.0.0.1",
        port=port,
        debug=reload_on_edit,
        use_reloader=reload_on_edit,
        threaded=True,
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(0)
