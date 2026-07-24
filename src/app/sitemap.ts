import type { MetadataRoute } from "next";
import { getPaginatedWorks } from "@/lib/data/content";
import { getSiteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const works = await getPaginatedWorks({ page: 1, pageSize: 1000, sort: "newest" });

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/works`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const workRoutes: MetadataRoute.Sitemap = works.items.map((work) => ({
    url: `${siteUrl}/works/${work.slug}`,
    lastModified: work.published_at ? new Date(work.published_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...workRoutes];
}
