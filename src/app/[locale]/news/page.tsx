import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { getPostsByCategory } from "@/lib/posts";
import { PostCard } from "@/components/posts/post-card";
import { PostListItem } from "@/components/posts/post-list-item";
import { PostsTabNav } from "@/components/posts/posts-tab-nav";

const CARD_LIMIT = 6;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "News | TokFresh",
    description:
      "Announcements and blog posts from TokFresh — product news, tips, and insights.",
    alternates: {
      canonical: locale === "en" ? "/news" : `/${locale}/news`,
      languages: {
        en: "/en/news",
        ko: "/ko/news",
        "x-default": "/news",
      },
    },
    openGraph: {
      url: locale === "en" ? "/news" : `/${locale}/news`,
    },
  };
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const posts = getPostsByCategory(locale, ["announcements", "blog"]);
  const cardPosts = posts.slice(0, CARD_LIMIT);
  const listPosts = posts.slice(CARD_LIMIT);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <PostsTabNav className="mb-8 border-b border-border pb-2" />

        <section>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {cardPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>

        {listPosts.length > 0 && (
          <section className="mt-12">
            <div className="flex flex-col">
              {listPosts.map((post) => (
                <PostListItem key={post.slug} post={post} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
