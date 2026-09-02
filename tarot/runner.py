"""Shared body for the two standalone bootstrappers.

tarot-setup.py carries the project inside itself; tarot-fromgit.py clones it.
Everything after the files land on disk is identical, so it lives here and is
spliced into both by make_installer.py at the __RUNNER__ marker. Neither
generated file imports it -- each one has to be a single file.

Not meant to be run on its own.
"""

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
# the whole tail, shared by both bootstrappers
# --------------------------------------------------------------------------

def prepare_and_launch(dest):
    """Build the environment, seed, and serve. Everything after files land."""
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


def check_python():
    if sys.version_info < (3, 9):
        stop(
            "Python 3.9 or newer is required, this is %d.%d. Install a current "
            "version from python.org and tick 'Add Python to PATH'."
            % sys.version_info[:2]
        )


def banner(title, dest):
    say("")
    rule()
    say("  " + title)
    say("  " + str(dest))
    rule()
    say("")


def writable(dest):
    try:
        dest.mkdir(parents=True, exist_ok=True)
        probe = dest / ".write-test"
        probe.write_text("ok", encoding="ascii")
        probe.unlink()
    except OSError as error:
        stop("cannot write to %s\n%s" % (dest, error))


def destination(default_name="tarot"):
    """Where the project goes.

    An explicit argument wins. Otherwise it is a folder beside this file -
    unless this file is already inside one by that name, in which case
    installing a second level down would be surprising.
    """
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    if args:
        return pathlib.Path(args[0]).expanduser().resolve()
    here = pathlib.Path(__file__).resolve().parent
    if here.name.lower() == default_name:
        return here
    return here / default_name
