import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/onboarding", "/dashboard", "/settings", "/profile"],
      },
    ],
    sitemap: "https://www.pairfect.site/sitemap.xml",
  };
}
