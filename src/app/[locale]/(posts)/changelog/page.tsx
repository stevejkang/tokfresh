import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { getPostsByCategory } from "@/lib/posts";
import { PostsSectionHeader } from "@/components/posts/posts-section-header";
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
    title: t("changelog"),
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
    <div className="mx-auto max-w-5xl px-6 py-12">
      <PostsSectionHeader title={t("changelog")} className="mb-10" />

      {posts.length > 0 ? (
        <div className="flex flex-col gap-14">
          {posts.map((post, index) => (
            <TimelineEntry
              key={post.slug}
              post={post}
              isFirst={index === 0}
            />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center text-muted-foreground">
          {t("noResults")}
        </p>
      )}
    </div>
  );
}
