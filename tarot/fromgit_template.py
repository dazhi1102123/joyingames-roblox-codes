#!/usr/bin/env python3
"""Arcana Press - clone from GitHub and run.

Put this file where you want the project to live and run it:

    Windows    double-click, or:  py -3 tarot-fromgit.py
    macOS      python3 tarot-fromgit.py
    Linux      python3 tarot-fromgit.py

Pass a path to install somewhere else:

    py -3 tarot-fromgit.py D:\\website\\tarot

The site lives in a "tarot" subfolder of the repository. A plain clone would
therefore leave the code one level deeper than you asked for, so this makes a
shallow clone into a scratch folder, lifts that subfolder into place, and
throws the clone away. The commit it came from is recorded in SOURCE.txt.

Re-run it to pull the latest code down. Your .env, your database and your
virtualenv are never touched - only files that exist in the repository are
overwritten, so local edits to those are lost, which is the point of pulling.

Requires git on PATH. If you would rather not install git, use tarot-setup.py,
which carries the same code inside itself and needs nothing but Python.

Generated file - do not edit. Rebuild it with make_installer.py.
"""

import os
import pathlib
import shutil
import socket
import subprocess
import sys
import tempfile

REPO = "__REPO__"
BRANCH = "__BRANCH__"
SUBDIR = "tarot"
DEFAULT_PORT = 5000

# Never overwritten by a pull: your configuration and your data.
PRESERVE = {".env", "readings.db"}


__RUNNER__


# --------------------------------------------------------------------------
# fetch
# --------------------------------------------------------------------------

def need_git():
    if shutil.which("git"):
        return
    stop(
        "git is not on PATH.\n"
        "Install it from https://git-scm.com/download/win and open a new\n"
        "window, or use tarot-setup.py instead - that one needs only Python."
    )


def clone(into):
    """Shallow-clone the branch. Depth 1 keeps it to a couple of megabytes."""
    say("Cloning %s (%s)" % (REPO, BRANCH))
    result = subprocess.run(
        ["git", "clone", "--depth", "1", "--branch", BRANCH, REPO, str(into)],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "").strip()
        say(detail[-2000:])
        stop(
            "the clone failed - the output above says why.\n"
            "A private repository will ask you to sign in; if no sign-in\n"
            "window appeared, run this once in a terminal:\n"
            "    git clone " + REPO
        )
    head = subprocess.run(
        ["git", "-C", str(into), "rev-parse", "HEAD"],
        capture_output=True, text=True,
    )
    return head.stdout.strip() or "unknown"


def lift(clone_dir, dest):
    """Copy the project subfolder out of the clone and into dest."""
    source = clone_dir / SUBDIR
    if not source.is_dir():
        stop("the clone has no %s/ folder - is the branch name right?" % SUBDIR)

    copied = []
    for path in sorted(source.rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(source)
        target = dest / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)
        copied.append(target)

    if not copied:
        stop("the clone's %s/ folder is empty" % SUBDIR)
    empty = [p.name for p in copied if p.stat().st_size == 0]
    if empty:
        stop("these files came out empty: " + ", ".join(empty))
    return len(copied)


def fetch(dest):
    """Clone into a scratch folder, lift the project out, discard the clone."""
    need_git()
    scratch = pathlib.Path(tempfile.mkdtemp(prefix="tarot-clone-"))
    try:
        commit = clone(scratch / "repo")
        count = lift(scratch / "repo", dest)
    finally:
        shutil.rmtree(scratch, ignore_errors=True)

    (dest / "SOURCE.txt").write_text(
        "%s\n%s\n%s\n" % (REPO, BRANCH, commit), encoding="ascii"
    )
    return count, commit


# --------------------------------------------------------------------------

def main():
    check_python()
    dest = destination()
    banner("Arcana Press - cloning into", dest)
    writable(dest)

    kept = sorted(name for name in PRESERVE if (dest / name).exists())
    count, commit = fetch(dest)
    say("  + %d files at %s" % (count, commit[:12]))
    if kept:
        say("  = kept your " + ", ".join(kept))

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
