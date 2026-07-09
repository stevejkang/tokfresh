import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getAllSlugs, getPostBySlug } from "@/lib/posts";
import type { PostCategory } from "@/types/post";
import { mdxComponents } from "./mdx-components";

const categoryTranslationKeys: Record<PostCategory, string> = {
  "product-updates": "categoryProductUpdates",
  announcements: "categoryAnnouncements",
  blog: "categoryBlog",
};

export function generateStaticParams() {
  const slugs = getAllSlugs();
  const params: { locale: string; slug: string }[] = [];

  for (const slug of slugs) {
    for (const locale of routing.locales) {
      const post = getPostBySlug(slug, locale);
      if (post !== null && !post.draft) {
        params.push({ locale, slug });
      }
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug, locale);

  if (!post || post.draft) {
    return {};
  }

  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    const otherPost = getPostBySlug(slug, loc);
    if (otherPost && !otherPost.draft) {
      languages[loc] = `/${loc}/posts/${slug}`;
    }
  }

  if (languages["en"]) {
    languages["x-default"] = `/posts/${slug}`;
  }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical:
        locale === "en" ? `/posts/${slug}` : `/${locale}/posts/${slug}`,
      languages,
    },
    openGraph: {
      url: locale === "en" ? `/posts/${slug}` : `/${locale}/posts/${slug}`,
    },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = getPostBySlug(slug, locale);

  if (post === null) {
    notFound();
  }

  if (post.draft === true) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "Posts" });
  const format = await getFormatter({ locale });

  const categoryLabel = t(categoryTranslationKeys[post.category]);
  const formattedDate = format.dateTime(new Date(post.publishedAt), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6">
      <nav className="mb-8 text-center text-sm text-muted-foreground">
        <Link
          href="/posts"
          className="transition-colors hover:text-foreground"
        >
          {t("backToPosts")}
        </Link>
        <span className="mx-2">/</span>
        <span>{categoryLabel}</span>
      </nav>

      <h1 className="mb-8 text-center text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        {post.title}
      </h1>

      {post.heroImage && (
        <div className="mx-auto mb-8 max-w-2xl overflow-hidden rounded-lg">
          <Image
            src={post.heroImage}
            alt={post.title}
            width={1200}
            height={630}
            className="h-auto w-full"
            priority
          />
        </div>
      )}

      <p className="mb-12 text-center text-sm text-muted-foreground">
        {post.author} &middot; {formattedDate}
      </p>

      <div className="mx-auto max-w-prose">
        <MDXRemote
          source={post.content}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
            },
          }}
          components={mdxComponents}
        />
      </div>
    </article>
  );
}
