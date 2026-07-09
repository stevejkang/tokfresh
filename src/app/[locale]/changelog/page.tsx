import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { getPostsByCategory } from "@/lib/posts";
import { PostsTabNav } from "@/components/posts/posts-tab-nav";
import { TimelineEntry } from "@/components/posts/timeline-entry";

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
    title: `${t("changelog")} | TokFresh`,
    description: t("categoryProductUpdates"),
    alternates: {
      canonical:
        locale === "en" ? "/changelog" : `/${locale}/changelog`,
      languages: {
        en: "/en/changelog",
        ko: "/ko/changelog",
        "x-default": "/changelog",
      },
    },
    openGraph: {
      url: locale === "en" ? "/changelog" : `/${locale}/changelog`,
    },
  };
}

export default async function ChangelogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Posts");
  const posts = getPostsByCategory(locale, ["product-updates"]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-4xl font-bold tracking-tighter text-foreground sm:text-5xl">
        {t("changelog")}
      </h1>

      <PostsTabNav className="mb-12 border-b border-border pb-2" />

      <div className="flex flex-col gap-14">
        {posts.map((post, index) => (
          <TimelineEntry
            key={post.slug}
            post={post}
            isFirst={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
