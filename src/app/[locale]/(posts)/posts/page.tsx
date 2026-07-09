import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { getAllPosts } from "@/lib/posts";
import { PostsListClient } from "@/components/posts/posts-list-client";

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
    title: t("recentUpdates"),
    description: t("postsDescription"),
    alternates: {
      canonical: locale === "en" ? "/posts" : `/${locale}/posts`,
      languages: {
        en: "/en/posts",
        ko: "/ko/posts",
        "x-default": "/posts",
      },
    },
    openGraph: {
      url: locale === "en" ? "/posts" : `/${locale}/posts`,
    },
  };
}

export default async function PostsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Posts" });
  const posts = getAllPosts(locale).map(({ content: _, ...rest }) => ({
    ...rest,
    content: "",
  }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <PostsListClient posts={posts} title={t("recentUpdates")} />
    </div>
  );
}
