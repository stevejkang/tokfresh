import type { MetadataRoute } from "next";
import { getAllPosts, getAllSlugs, getPostBySlug } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

  const staticEntries: MetadataRoute.Sitemap = [
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
    {
      url: `${baseUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
      alternates: {
        languages: {
          en: `${baseUrl}/en/posts`,
          ko: `${baseUrl}/ko/posts`,
        },
      },
    },
    {
      url: `${baseUrl}/changelog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
      alternates: {
        languages: {
          en: `${baseUrl}/en/changelog`,
          ko: `${baseUrl}/ko/changelog`,
        },
      },
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
      alternates: {
        languages: {
          en: `${baseUrl}/en/news`,
          ko: `${baseUrl}/ko/news`,
        },
      },
    },
  ];

  // getAllPosts already excludes drafts and gives us publishedAt/updatedAt
  // data for the English (primary) locale in one pass.
  const enPostsBySlug = new Map(
    getAllPosts("en").map((post) => [post.slug, post]),
  );

  const postEntries: MetadataRoute.Sitemap = getAllSlugs().flatMap((slug) => {
    const enPost = enPostsBySlug.get(slug);
    // Skip slugs with no published English post (missing or draft).
    if (!enPost) return [];

    const koPost = getPostBySlug(slug, "ko");

    const languages: Record<string, string> = {
      en: `${baseUrl}/en/posts/${slug}`,
    };
    if (koPost && !koPost.draft) {
      languages.ko = `${baseUrl}/ko/posts/${slug}`;
    }

    return [
      {
        url: `${baseUrl}/posts/${slug}`,
        lastModified: new Date(enPost.updatedAt ?? enPost.publishedAt),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: {
          languages,
        },
      },
    ];
  });

  return [...staticEntries, ...postEntries];
}
