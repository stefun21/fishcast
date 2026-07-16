import type { MetadataRoute } from "next";
import { demoLakes } from "@/data/lakes";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: "/", lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: "/lakes", lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: "/explore", lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: "/favorites", lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const lakeRoutes: MetadataRoute.Sitemap = demoLakes.map((lake) => ({
    url: `/lakes/${lake.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...lakeRoutes];
}
