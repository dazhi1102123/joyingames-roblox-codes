#!/usr/bin/env python3
"""Build tarot-setup.py: one file that carries the whole site inside it.

    python make_installer.py [output.py]

Zip archives keep arriving on Windows as empty folders, so this removes the
archive step entirely. The generated file is plain ASCII Python: it writes the
project next to itself, builds a virtualenv, installs Flask, seeds example data
and opens a browser. Nothing to unpack, nothing to configure.

The payload is a gzipped tar built from the files git tracks, so it can never
pick up a local .env, a database or a virtualenv.
"""

from __future__ import annotations

import base64
import io
import pathlib
import subprocess
import sys
import tarfile

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
# Build machinery: needed to rebuild the installer, not to run the site.
BUILD_ONLY = {"tarot/make_installer.py", "tarot/installer_template.py"}

# 76 chars keeps the generated source inside a sane line length.
WIDTH = 76


def tracked():
    out = subprocess.check_output(["git", "ls-files", "tarot/"], cwd=ROOT, text=True)
    names = [n for n in out.split("\n") if n.strip() and n not in BUILD_ONLY]
    missing = [n for n in names if not (ROOT / n).is_file()]
    if missing:
        raise SystemExit(f"tracked but not on disk: {missing}")
    return sorted(names)


def payload(names):
    """A gzipped tar of the project, with stable metadata so rebuilds match."""
    raw = io.BytesIO()
    with tarfile.open(fileobj=raw, mode="w:gz", compresslevel=9) as tar:
        for name in names:
            path = ROOT / name
            info = tar.gettarinfo(str(path), arcname=name)
            # Reproducible: no mtimes, no uid/gid from this machine. Keep only
            # the execute bit, which dev.sh needs on macOS and Linux.
            info.mtime = 0
            info.uid = info.gid = 0
            info.uname = info.gname = ""
            info.mode = 0o755 if info.mode & 0o100 else 0o644
            with open(path, "rb") as fh:
                tar.addfile(info, fh)
    return raw.getvalue()


def main():
    dest = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "tarot-setup.py")
    names = tracked()
    blob = payload(names)
    b64 = base64.b64encode(blob).decode("ascii")
    lines = "\n".join(f'    "{b64[i:i + WIDTH]}"' for i in range(0, len(b64), WIDTH))

    template = (HERE / "installer_template.py").read_text(encoding="utf-8")
    if "__PAYLOAD__" not in template:
        raise SystemExit("installer_template.py has no __PAYLOAD__ marker")
    source = template.replace("    __PAYLOAD__", lines)
    source = source.replace("__FILE_COUNT__", str(len(names)))

    if not source.isascii():
        bad = sorted({c for c in source if not c.isascii()})
        raise SystemExit(f"generated source is not ASCII: {bad}")

    dest.write_text(source, encoding="ascii", newline="\n")
    print(f"{dest}  {len(names)} files  {dest.stat().st_size:,} bytes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
