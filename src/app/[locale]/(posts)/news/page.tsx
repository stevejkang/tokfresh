import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { getPostsByCategory } from "@/lib/posts";
import { PostCard } from "@/components/posts/post-card";
import { PostListItem } from "@/components/posts/post-list-item";
import { PostsSectionHeader } from "@/components/posts/posts-section-header";

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
  const t = await getTranslations({ locale, namespace: "Posts" });

  return {
    title: t("news"),
    description: t("newsDescription"),
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

  const t = await getTranslations("Posts");
  const posts = getPostsByCategory(locale, ["announcements", "blog"]);
  const cardPosts = posts.slice(0, CARD_LIMIT);
  const listPosts = posts.slice(CARD_LIMIT);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <PostsSectionHeader title={t("news")} className="mb-10" />

      {posts.length > 0 ? (
        <>
          <section>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
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
        </>
      ) : (
        <p className="py-20 text-center text-muted-foreground">
          {t("noResults")}
        </p>
      )}
    </div>
  );
}
