import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/seo-content";
import { listRings } from "@/lib/rings";
import { IS_PREVIEW, SITE_URL } from "@/lib/discovery";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (IS_PREVIEW) return [];
  const site = SITE_URL;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site}/capture-guide`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site}/moments`, changeFrequency: "daily", priority: 0.8 },
    { url: `${site}/guides`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${site}/startup-launch`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${site}/launches`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site}/imprint`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site}/terms`, changeFrequency: "yearly", priority: 0.3 },
    ...GUIDES.map((guide) => ({
      url: `${site}/guides/${guide.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];

  try {
    const rings = await listRings(200);
    const launchRoutes: MetadataRoute.Sitemap = rings
      .filter((ring) => ring.indexable && Boolean(ring.socialUrl))
      .map((ring) => ({
        url: `${site}/launches/${ring.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.65,
      }));
    return [...staticRoutes, ...launchRoutes];
  } catch {
    return staticRoutes;
  }
}
