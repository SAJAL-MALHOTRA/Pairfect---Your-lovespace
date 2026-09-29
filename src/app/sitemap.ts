import { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/seo/registry";

const BASE_URL = "https://www.pairfect.site";

// Use a fixed date so search engines don't think content changes on every request
const LAST_UPDATED = new Date("2026-09-29");

export default function sitemap(): MetadataRoute.Sitemap {
  const seoPages = getAllSlugs().map((slug) => ({
    url: `${BASE_URL}/${slug}`,
    lastModified: LAST_UPDATED,
    changeFrequency: "monthly" as const,
    priority: slug.startsWith("glossary/") ? 0.6 : 0.8,
  }));

  const staticPages = [
    { url: BASE_URL, lastModified: LAST_UPDATED, changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${BASE_URL}/login`, lastModified: LAST_UPDATED, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE_URL}/signup`, lastModified: LAST_UPDATED, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: LAST_UPDATED, changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  return [...staticPages, ...seoPages];
}
