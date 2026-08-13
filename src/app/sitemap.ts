import { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/seo/registry";

const BASE_URL = "https://www.pairfect.site";

export default function sitemap(): MetadataRoute.Sitemap {
  const seoPages = getAllSlugs().map((slug) => ({
    url: `${BASE_URL}/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: slug.startsWith("glossary/") ? 0.6 : 0.8,
  }));

  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE_URL}/signup`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  return [...staticPages, ...seoPages];
}
