@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion
pushd "%~dp0"

rem ===========================================================================
rem  Arcana Press - Windows launcher
rem
rem  Double-click this file. It creates a virtual environment, installs Flask,
rem  writes .env with generated secrets, seeds example data and starts the site
rem  on http://localhost:5000
rem
rem  Everything it does is idempotent: run it as often as you like. Your .env,
rem  your database and any edits you make are never overwritten.
rem
rem  Requires Python 3.9 or newer.
rem ===========================================================================

set "PORT=5000"
if not "%~1"=="" set "PORT=%~1"

echo.
echo   Arcana Press
echo   ============
echo.

rem --- find a usable Python --------------------------------------------------
rem The py launcher ships with the official Windows installer and picks the
rem newest interpreter, so it is tried first.
set "PY="
py -3 -c "import sys; sys.exit(0 if sys.version_info>=(3,9) else 1)" >nul 2>&1
if not errorlevel 1 set "PY=py -3"

if not defined PY (
    python -c "import sys; sys.exit(0 if sys.version_info>=(3,9) else 1)" >nul 2>&1
    if not errorlevel 1 set "PY=python"
)

if not defined PY (
    echo   [X] Python 3.9 or newer was not found.
    echo.
    echo       Install it from https://www.python.org/downloads/
    echo       IMPORTANT: tick "Add python.exe to PATH" during setup,
    echo       then close this window and run this file again.
    echo.
    pause
    exit /b 1
)

for /f "delims=" %%v in ('%PY% -V 2^>^&1') do set "PYVER=%%v"
echo   Using !PYVER!

rem --- virtual environment ---------------------------------------------------
if not exist ".venv\Scripts\python.exe" (
    echo   Creating .venv ...
    %PY% -m venv .venv
    if errorlevel 1 (
        echo.
        echo   [X] Could not create the virtual environment.
        echo       On some systems this needs the python3-venv package.
        echo.
        pause
        exit /b 1
    )
)
set "VPY=.venv\Scripts\python.exe"

rem --- dependencies ----------------------------------------------------------
echo   Installing dependencies ^(first run takes a minute^) ...
"%VPY%" -m pip install --quiet --upgrade pip >nul 2>&1
"%VPY%" -m pip install --quiet -r requirements.txt
if errorlevel 1 (
    echo.
    echo   [X] Dependency install failed. The message above says why;
    echo       it is usually no internet connection or a proxy.
    echo.
    pause
    exit /b 1
)

rem --- configuration and example data ---------------------------------------
rem Shared with dev.sh so the two platforms cannot drift.
"%VPY%" bootstrap.py %PORT%
if errorlevel 1 (
    echo.
    echo   [X] Setup failed. See the message above.
    echo.
    pause
    exit /b 1
)

rem --- go --------------------------------------------------------------------
start "" "http://localhost:%PORT%"
"%VPY%" -c "from app import app; app.run(host='127.0.0.1', port=%PORT%, debug=True)"

echo.
echo   The server has stopped.
pause
popd
endlocal
