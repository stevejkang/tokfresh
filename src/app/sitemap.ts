import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      alternates: {
        languages: {
          en: `${baseUrl}/en`,
          ko: `${baseUrl}/ko`,
        },
      },
    },
    {
      url: `${baseUrl}/setup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: {
        languages: {
          en: `${baseUrl}/en/setup`,
          ko: `${baseUrl}/ko/setup`,
        },
      },
    },
  ];
}
