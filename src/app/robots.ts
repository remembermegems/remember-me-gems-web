import type { MetadataRoute } from "next";

// The beta site sets SITE_NOINDEX=true so search engines skip it while only
// family is testing; every other deploy (alpha, and the eventual live site)
// leaves it unset and stays crawlable.
export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_NOINDEX === "true") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return { rules: { userAgent: "*", allow: "/" } };
}
