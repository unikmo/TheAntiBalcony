import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/seo-content";
import { listRings } from "@/lib/rings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/launch`, lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${site}/startup-launch`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site}/launches`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...GUIDES.map((guide) => ({
      url: `${site}/guides/${guide.slug}`,
      lastModified: now,
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
        lastModified: new Date(ring.createdAt),
        changeFrequency: "monthly" as const,
        priority: 0.65,
      }));
    return [...staticRoutes, ...launchRoutes];
  } catch {
    return staticRoutes;
  }
}
