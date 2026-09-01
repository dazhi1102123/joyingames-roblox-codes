"""Load .env before anything reads the environment.

This is its own module because of an ordering bug it exists to prevent. Modules
that resolve configuration at import time — `store.DB_PATH` above all — are
bound the moment they are imported. If .env is loaded later, in the middle of
`app.py`, those values are already fixed and the file is silently ignored.

The failure that causes is quiet and expensive: point `READINGS_DB` at a backed
up volume in .env, deploy, and the app writes somewhere else entirely while
appearing to work.

So every entry point imports this first, and `setdefault` means a real
environment variable always beats the file.
"""

from __future__ import annotations

import os
from pathlib import Path

_loaded = False


def load(path=None):
    """Read KEY=VALUE lines from .env into the environment. Runs once."""
    global _loaded
    if _loaded and path is None:
        return
    _loaded = True

    env_path = Path(path) if path else Path(__file__).with_name(".env")
    if not env_path.exists():
        return

    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        # A real environment variable wins, so `FOO=bar python app.py` and
        # container-level config both override the file.
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load()
