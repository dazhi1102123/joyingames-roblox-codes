import type { MetadataRoute } from "next"
import { canonical } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing here is secret, but a per-visitor reading is not worth a
      // crawl budget and would only produce thin duplicate pages.
      disallow: ["/api/", "/desk", "/admin", "/order/", "/preview", "/subscribe/", "/unsubscribe"],
    },
    sitemap: canonical("/sitemap.xml"),
  }
}
