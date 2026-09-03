@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion
pushd "%~dp0"

rem ===========================================================================
rem  Arcana Press - Next.js build, Windows launcher
rem
rem  Double-click this file. It installs dependencies, seeds example data,
rem  builds the site and opens it at http://localhost:3000
rem
rem  Idempotent: run it as often as you like. Your database, your generated
rem  keys and any edits you make are never overwritten.
rem
rem  Requires Node 20 or newer. pnpm is provisioned by corepack, which ships
rem  with Node - there is nothing else to install.
rem ===========================================================================

set "PORT=3000"
if not "%~1"=="" set "PORT=%~1"

echo.
echo   Arcana Press
echo   ============
echo.

rem --- Node ------------------------------------------------------------------
where node >nul 2>&1
if errorlevel 1 (
    echo   [X] Node.js was not found.
    echo.
    echo       Install the LTS build from https://nodejs.org/
    echo       Then close this window and run this file again.
    echo.
    pause
    exit /b 1
)

for /f "delims=" %%v in ('node -v') do set "NODEV=%%v"
echo   Using Node !NODEV!

node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 20 ? 0 : 1)"
if errorlevel 1 (
    echo.
    echo   [X] Node 20 or newer is required, this is !NODEV!
    echo       Install the LTS build from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

rem --- pnpm, via corepack ----------------------------------------------------
rem corepack reads "packageManager" in package.json and fetches the exact
rem pnpm version this project was built with, so the machine needs only Node.
set "PNPM=pnpm"
where pnpm >nul 2>&1
if errorlevel 1 (
    echo   Enabling pnpm through corepack ...
    call corepack enable pnpm >nul 2>&1
    where pnpm >nul 2>&1
    if errorlevel 1 set "PNPM=corepack pnpm"
)

rem --- dependencies ----------------------------------------------------------
echo   Installing dependencies ^(first run takes a few minutes^) ...
call %PNPM% install --silent
if errorlevel 1 (
    echo.
    echo   [X] Install failed. The message above says why; it is usually no
    echo       internet connection, a proxy, or a missing build toolchain for
    echo       better-sqlite3.
    echo.
    pause
    exit /b 1
)

rem --- an admin key that survives restarts -----------------------------------
rem Written once to .env.local so the operator console keeps the same key
rem between runs. Next loads that file automatically.
if not exist "apps\site\.env.local" (
    echo   Writing apps\site\.env.local with a generated admin key ...
    node -e "const c=require('crypto');const fs=require('fs');fs.writeFileSync('apps/site/.env.local',['ADMIN_KEY='+c.randomBytes(18).toString('base64url'),'MAIL_TX_FROM=Arcana Press <hello@arcana.test>','MAIL_MK_FROM=Arcana Press <daily@arcana-daily.test>','NEXT_PUBLIC_SITE_URL=http://localhost:%PORT%',''].join('\n'))"
) else (
    echo   apps\site\.env.local already exists, left alone
)

rem --- example data ----------------------------------------------------------
echo   Seeding example readers and orders ...
call %PNPM% run seed
if errorlevel 1 (
    echo.
    echo   [X] Seeding failed. See the message above.
    echo.
    pause
    exit /b 1
)

rem --- build -----------------------------------------------------------------
echo.
echo   Building ^(99 pages, about a minute^) ...
call %PNPM% run build
if errorlevel 1 (
    echo.
    echo   [X] Build failed. See the message above.
    echo.
    pause
    exit /b 1
)

rem --- go --------------------------------------------------------------------
for /f "tokens=2 delims==" %%k in ('findstr /b "ADMIN_KEY=" "apps\site\.env.local"') do set "AKEY=%%k"

echo.
echo   --------------------------------------------------------------------
echo     http://localhost:%PORT%/preview     every page, in one list
echo.
echo     /admin  key: !AKEY!
echo     /desk   keys were printed by the seed step, above
echo.
echo     Emails print in this window instead of being sent.
echo     Press Ctrl-C to stop the server.
echo   --------------------------------------------------------------------
echo.

start "" "http://localhost:%PORT%/preview"
call %PNPM% --filter @arcana/site exec next start -p %PORT%

echo.
echo   The server has stopped.
pause
popd
endlocal
