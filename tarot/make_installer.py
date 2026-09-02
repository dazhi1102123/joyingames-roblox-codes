#!/usr/bin/env python3
"""Build the two standalone bootstrappers.

    python make_installer.py [output-directory]

Writes:

    tarot-setup.py    carries the whole project inside it as a gzipped tar
    tarot-fromgit.py  clones the project from GitHub instead

Zip archives keep arriving on Windows as empty folders, so tarot-setup.py
removes the archive step entirely. Both files are plain ASCII Python, both
install into a folder beside themselves, and everything after the files land
on disk is the same code -- runner.py, spliced into both at the __RUNNER__
marker. Neither can import it, because each has to be one file.

The tarot-setup.py payload is built from the files git tracks, so it can never
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
BUILD_ONLY = {
    "tarot/make_installer.py",
    "tarot/installer_template.py",
    "tarot/fromgit_template.py",
    "tarot/runner.py",
}

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


def repo_and_branch():
    """Where tarot-fromgit.py should clone from: this checkout's own origin."""
    url = subprocess.check_output(
        ["git", "remote", "get-url", "origin"], cwd=ROOT, text=True
    ).strip()
    if not url.endswith(".git"):
        url += ".git"
    branch = subprocess.check_output(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=ROOT, text=True
    ).strip()
    return url, branch


def runner_body():
    """runner.py without its module docstring -- it is spliced, not imported."""
    text = (HERE / "runner.py").read_text(encoding="utf-8")
    body = text.split('"""', 2)[2]
    return body.strip("\n")


def emit(dest, template, substitutions):
    source = (HERE / template).read_text(encoding="utf-8")
    for marker, value in substitutions.items():
        if marker not in source:
            raise SystemExit(f"{template} has no {marker} marker")
        source = source.replace(marker, value)

    if not source.isascii():
        bad = sorted({c for c in source if not c.isascii()})
        raise SystemExit(f"{dest} is not ASCII: {bad}")
    compile(source, str(dest), "exec")

    dest.write_text(source, encoding="ascii", newline="\n")
    print(f"{dest}  {dest.stat().st_size:,} bytes")


def main():
    out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    out.mkdir(parents=True, exist_ok=True)

    names = tracked()
    b64 = base64.b64encode(payload(names)).decode("ascii")
    lines = "\n".join(f'    "{b64[i:i + WIDTH]}"' for i in range(0, len(b64), WIDTH))
    runner = runner_body()
    repo, branch = repo_and_branch()

    print(f"{len(names)} files, {len(b64):,} bytes of payload")
    emit(out / "tarot-setup.py", "installer_template.py", {
        "    __PAYLOAD__": lines,
        "__FILE_COUNT__": str(len(names)),
        "__RUNNER__": runner,
    })
    emit(out / "tarot-fromgit.py", "fromgit_template.py", {
        "__RUNNER__": runner,
        "__REPO__": repo,
        "__BRANCH__": branch,
    })
    return 0


if __name__ == "__main__":
    sys.exit(main())
