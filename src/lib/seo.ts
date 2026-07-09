import type { Metadata } from "next";
import type { Post } from "@/types/post";
import { routing } from "@/i18n/routing";
import { getPostBySlug } from "@/lib/posts";

const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export function generateArticleJsonLd(
  post: Post,
  locale: string,
): Record<string, unknown> {
  const canonicalUrl = `${baseUrl}/${locale}/posts/${post.slug}`;
  const image = post.ogImage ?? post.heroImage;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    author: { "@type": "Person", name: post.author },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    publisher: {
      "@type": "Organization",
      name: "TokFresh",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/favicon.ico`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    inLanguage: locale,
  };

  if (image) {
    jsonLd.image = image.startsWith("http") ? image : `${baseUrl}${image}`;
  }

  return jsonLd;
}

export function generatePostMetadata(
  post: Post,
  locale: string,
): Metadata {
  const canonicalUrl =
    locale === "en" ? `/posts/${post.slug}` : `/${locale}/posts/${post.slug}`;

  const image = post.ogImage ?? post.heroImage;
  const ogImageUrl = image
    ? image.startsWith("http")
      ? image
      : `${baseUrl}${image}`
    : null;

  // Build hreflang map — only include locales where the translation exists
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    const otherPost = getPostBySlug(post.slug, loc);
    if (otherPost && !otherPost.draft) {
      languages[loc] = `/${loc}/posts/${post.slug}`;
    }
  }
  if (languages["en"]) {
    languages["x-default"] = `/posts/${post.slug}`;
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url: canonicalUrl,
      ...(ogImageUrl && {
        images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      }),
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [post.author],
      locale: locale === "ko" ? "ko_KR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      ...(ogImageUrl && { images: [ogImageUrl] }),
    },
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
  };
}
