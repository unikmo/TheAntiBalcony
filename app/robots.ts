import type { MetadataRoute } from "next";
import { IS_PREVIEW, SITE_URL } from "@/lib/discovery";

export default function robots(): MetadataRoute.Robots {
  if (IS_PREVIEW) return { rules: { userAgent: "*", disallow: "/" } };
  // Crawlers need access to see noindex on card/detail pages. These URLs are
  // excluded from sitemaps; robots directives are not access control.
  const policy = { allow: "/", disallow: ["/api/"] };
  return { rules: [
    { userAgent: "*", ...policy },
    { userAgent: ["OAI-SearchBot", "PerplexityBot"], ...policy },
  ], sitemap: `${SITE_URL}/sitemap.xml` };
}
