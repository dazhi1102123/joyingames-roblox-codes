import { SITEMAP_PAGES } from "../sitemap"
import { canonical } from "@/lib/site"

/** The sitemap index.
 *
 * Exporting generateSitemaps moves the sitemap itself to /sitemap/0.xml,
 * /sitemap/1.xml and so on -- and leaves /sitemap.xml a 404, which is exactly
 * where robots.txt and every search console points people at. This serves the index
 * that ties them together, so there is still one canonical entry point.
 */
export const dynamic = "force-static"

export function GET() {
  const today = new Date().toISOString().slice(0, 10)
  const body = Array.from({ length: SITEMAP_PAGES }, (_, i) =>
    `<sitemap><loc>${canonical(`/sitemap/${i}.xml`)}</loc><lastmod>${today}</lastmod></sitemap>`,
  ).join("")

  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      body +
      "</sitemapindex>",
    { headers: { "Content-Type": "application/xml" } },
  )
}
