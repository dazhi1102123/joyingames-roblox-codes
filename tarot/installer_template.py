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

The whole project is carried inside this file as a gzipped tar, so there is
no archive to extract and nothing to download. Nothing is sent anywhere, and
no API keys are needed: payment runs in manual mode and email prints to this
window instead of being delivered.

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

FILE_COUNT = __FILE_COUNT__
DEFAULT_PORT = 5000

PAYLOAD = (
    __PAYLOAD__
)


__RUNNER__


# --------------------------------------------------------------------------
# unpack
# --------------------------------------------------------------------------

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
            target.write_bytes(source.read())
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

def main():
    check_python()
    dest = destination()
    banner("Arcana Press - installing into", dest)
    writable(dest)

    say("Writing project files")
    say("  + %d files" % unpack(dest))

    return prepare_and_launch(dest)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(0)
    except Exception as error:
        import traceback
        traceback.print_exc()
        stop(repr(error))
