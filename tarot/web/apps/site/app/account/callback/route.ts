import { NextResponse } from "next/server"
import { SESSION_COOKIE, cookieOptions, redeemLink, sweepSessions } from "@/lib/accounts"
import { SITE } from "@/lib/site"

/** Spending a sign-in link.
 *
 * A route handler rather than a page, because signing in means setting a
 * cookie and a Server Component render is not allowed to. That constraint is
 * right: rendering a page must not have side effects, and this very much does.
 *
 * A GET that changes state is normally the wrong shape, but a link in an email
 * is a GET. It is safe here because the token is single-use and expires in
 * fifteen minutes -- the worst a prefetching mail client can do is burn a link
 * its own user asked for, which lands them on the "expired" page one click
 * from a new one.
 */
export async function GET(request: Request) {
  sweepSessions()

  const url = new URL(request.url)
  const session = redeemLink(url.searchParams.get("t") ?? "")

  // Redirect to the configured site, not to whatever the Host header claims.
  // A Host is attacker-supplied unless a proxy overwrites it, and a redirect
  // that follows it turns this route into an open redirect from a URL people
  // have been told to trust. The one exception is a local host, where there is
  // no attacker and SITE.url would otherwise send a developer on port 3210 to
  // port 3000.
  const host = request.headers.get("host") ?? ""
  const local = host.startsWith("localhost:") || host.startsWith("127.0.0.1:")
  const base = local ? url.origin : SITE.url || url.origin

  if (!session) {
    const why = "That link has been used already, or is more than fifteen minutes old."
    return NextResponse.redirect(`${base}/account?error=${encodeURIComponent(why)}`)
  }

  const response = NextResponse.redirect(`${base}/account`)
  response.cookies.set(
    SESSION_COOKIE,
    session,
    cookieOptions(request.headers.get("host") ?? "", 60 * 60 * 24 * 60),
  )
  return response
}
