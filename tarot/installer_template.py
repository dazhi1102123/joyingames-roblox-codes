#!/usr/bin/env python3
"""Arcana Press - one-file installer and launcher.

Put this file where you want the project to live and run it:

    Windows    double-click, or:  py -3 tarot-setup.py
    macOS      python3 tarot-setup.py
    Linux      python3 tarot-setup.py

It writes a "tarot" folder next to itself, builds a virtualenv, installs
Flask, seeds example data and opens the site in your browser. If this file
already sits in a folder named "tarot", it installs in place instead.

Pass a path to install somewhere else:

    py -3 tarot-setup.py D:\\website\\tarot

Nothing is sent anywhere. No API keys are needed: payment runs in manual mode
and email prints to this window instead of being delivered.

Generated file - do not edit. Rebuild it with make_installer.py.
"""

import base64
import gzip
import io
import os
import pathlib
import socket
import subprocess
import sys
import tarfile
import threading
import time
import webbrowser

FILE_COUNT = __FILE_COUNT__
DEFAULT_PORT = 5000

PAYLOAD = (
    __PAYLOAD__
)


# --------------------------------------------------------------------------
# output
# --------------------------------------------------------------------------

def say(text):
    print(text, flush=True)


def rule():
    say("-" * 70)


def stop(text):
    """Report a failure and hold the window open so the message is readable."""
    say("")
    rule()
    say("FAILED: " + text)
    rule()
    hold()
    sys.exit(1)


def hold():
    if os.name == "nt" and sys.stdin is not None and sys.stdin.isatty():
        try:
            input("\nPress Enter to close this window. ")
        except (EOFError, KeyboardInterrupt):
            pass


# --------------------------------------------------------------------------
# unpack
# --------------------------------------------------------------------------

def destination():
    """Where the project goes.

    An explicit argument wins. Otherwise it is a "tarot" folder beside this
    file - unless this file is already inside one, in which case installing a
    second level down would be surprising.
    """
    if len(sys.argv) > 1:
        return pathlib.Path(sys.argv[1]).expanduser().resolve()
    here = pathlib.Path(__file__).resolve().parent
    if here.name.lower() == "tarot":
        return here
    return here / "tarot"


def unpack(dest):
    """Write the embedded project into dest.

    Only files the archive names are touched, so a .env, a database or a
    virtualenv from an earlier run survives a re-run untouched.
    """
    raw = gzip.decompress(base64.b64decode(PAYLOAD))
    written = []
    with tarfile.open(fileobj=io.BytesIO(raw), mode="r") as tar:
        for member in tar.getmembers():
            if not member.isfile():
                continue
            parts = pathlib.PurePosixPath(member.name).parts
            if parts[0] != "tarot" or ".." in parts or parts[-1].startswith("/"):
                stop("archive contains an unexpected path: " + member.name)
            target = dest.joinpath(*parts[1:])
            target.parent.mkdir(parents=True, exist_ok=True)
            source = tar.extractfile(member)
            if source is None:
                stop("archive entry could not be read: " + member.name)
            data = source.read()
            target.write_bytes(data)
            if os.name != "nt" and member.mode & 0o100:
                target.chmod(0o755)
            written.append(target)

    if len(written) != FILE_COUNT:
        stop("expected %d files, wrote %d" % (FILE_COUNT, len(written)))
    # Only the files just written. Walking the whole folder would pick up a
    # virtualenv from an earlier run, which is full of empty py.typed markers.
    empty = [p.name for p in written if p.stat().st_size == 0]
    if empty:
        stop("these files came out empty: " + ", ".join(empty))
    return len(written)


# --------------------------------------------------------------------------
# python environment
# --------------------------------------------------------------------------

def venv_python(venv):
    if os.name == "nt":
        return venv / "Scripts" / "python.exe"
    return venv / "bin" / "python"


def interpreter(dest):
    """Return a python that has Flask, building a virtualenv if it can.

    Some Windows installs cannot create a virtualenv (the Microsoft Store
    build in particular). Falling back to the running interpreter is better
    than stopping - the only cost is that Flask lands in the user's own
    site-packages rather than a throwaway folder.
    """
    venv = dest / ".venv"
    python = venv_python(venv)

    if not python.exists():
        say("Creating a virtualenv")
        result = subprocess.run(
            [sys.executable, "-m", "venv", str(venv)],
            capture_output=True, text=True,
        )
        if result.returncode != 0 or not python.exists():
            detail = (result.stderr or "").strip().splitlines()
            say("  ! virtualenv unavailable, using this Python instead")
            say("    " + (detail[-1] if detail else "(no detail given)"))
            python = pathlib.Path(sys.executable)

    if has_flask(python):
        say("Flask is already installed")
        return python

    say("Installing Flask")
    command = [str(python), "-m", "pip", "install", "--quiet", "flask"]
    if python == pathlib.Path(sys.executable):
        command.insert(4, "--user")
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0 or not has_flask(python):
        detail = (result.stderr or result.stdout or "").strip()
        say(detail[-1500:])
        stop(
            "Flask could not be installed. If you are behind a proxy or "
            "offline, install it by hand and run this file again:\n"
            "    " + str(python) + " -m pip install flask"
        )
    return python


def has_flask(python):
    result = subprocess.run(
        [str(python), "-c", "import flask"], capture_output=True, text=True
    )
    return result.returncode == 0


# --------------------------------------------------------------------------
# run
# --------------------------------------------------------------------------

def free_port(start):
    """First free port at or after start, so a second copy does not collide."""
    for port in range(start, start + 40):
        with socket.socket() as probe:
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                probe.bind(("127.0.0.1", port))
            except OSError:
                continue
            return port
    stop("no free port between %d and %d" % (start, start + 40))


def launch(python, dest, port):
    url = "http://localhost:%d" % port
    threading.Thread(target=open_when_ready, args=(url, port), daemon=True).start()
    say("")
    rule()
    say("  " + url)
    say("")
    say("  Emails print in this window instead of being sent.")
    say("  Press Ctrl-C to stop the server.")
    rule()
    say("")
    code = "from app import app; app.run(host='127.0.0.1', port=%d, threaded=True)" % port
    try:
        return subprocess.call([str(python), "-c", code], cwd=str(dest))
    except KeyboardInterrupt:
        return 0


def open_when_ready(url, port, timeout=30):
    """Open a browser once the port answers, so the first hit is not a refusal."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        with socket.socket() as probe:
            probe.settimeout(0.5)
            if probe.connect_ex(("127.0.0.1", port)) == 0:
                try:
                    webbrowser.open(url)
                except Exception:
                    pass
                return
        time.sleep(0.3)


# --------------------------------------------------------------------------

def main():
    if sys.version_info < (3, 9):
        stop(
            "Python 3.9 or newer is required, this is %d.%d. Install a current "
            "version from python.org and tick 'Add Python to PATH'."
            % sys.version_info[:2]
        )

    dest = destination()
    say("")
    rule()
    say("  Arcana Press - installing into")
    say("  " + str(dest))
    rule()
    say("")

    try:
        dest.mkdir(parents=True, exist_ok=True)
        probe = dest / ".write-test"
        probe.write_text("ok", encoding="ascii")
        probe.unlink()
    except OSError as error:
        stop("cannot write to %s\n%s" % (dest, error))

    say("Writing project files")
    written = unpack(dest)
    say("  + %d files" % written)

    python = interpreter(dest)

    # Settle the port before writing .env, so the site URL in the config and
    # the port the server actually listens on cannot disagree.
    port = free_port(DEFAULT_PORT)

    say("Preparing configuration and example data")
    result = subprocess.run(
        [str(python), "bootstrap.py", str(port)],
        cwd=str(dest), capture_output=True, text=True,
    )
    if result.returncode != 0:
        say((result.stdout or "") + (result.stderr or ""))
        stop("setup did not finish - the output above says why")
    say(result.stdout.rstrip())

    return launch(python, dest, port)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(0)
    except Exception as error:
        import traceback
        traceback.print_exc()
        stop(repr(error))
