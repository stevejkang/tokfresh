import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { routing } from "@/i18n/routing";
import { getAllSlugs, getPostBySlug } from "@/lib/posts";
import type { PostCategory } from "@/types/post";

const geistRegular = await readFile(
  join(process.cwd(), "src/app/fonts/Geist-Regular.ttf"),
);
const geistBold = await readFile(
  join(process.cwd(), "src/app/fonts/Geist-Bold.ttf"),
);

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TokFresh";

// Hardcoded — image routes have no request context, next-intl is banned here.
const categoryLabels: Record<PostCategory, { en: string; ko: string }> = {
  "product-updates": { en: "Product Updates", ko: "제품 업데이트" },
  announcements: { en: "Announcements", ko: "공지사항" },
  blog: { en: "Blog", ko: "블로그" },
};

export function ogImageStaticParams() {
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

const fonts = [
  {
    name: "Geist",
    data: geistRegular,
    weight: 400 as const,
    style: "normal" as const,
  },
  {
    name: "Geist",
    data: geistBold,
    weight: 700 as const,
    style: "normal" as const,
  },
];

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug, locale);

  if (!post || post.draft) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0A0A0B",
          }}
        >
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 48,
              fontWeight: 700,
              fontFamily: "Geist",
            }}
          >
            TokFresh
          </span>
        </div>
      ),
      { ...size, fonts },
    );
  }

  const userImage = post.ogImage ?? post.heroImage;

  // RISK 1 fix: disk-read, NOT fetch — no running server during `next build`.
  if (userImage?.startsWith("/")) {
    const imageBuffer = await readFile(
      join(process.cwd(), "public", userImage),
    );
    const base64 = imageBuffer.toString("base64");
    const ext = userImage.split(".").pop() || "png";
    const dataUri = `data:image/${ext};base64,${base64}`;

    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex" }}>
          <img
            alt=""
            src={dataUri}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ),
      { ...size, fonts },
    );
  }

  if (userImage?.startsWith("http://") || userImage?.startsWith("https://")) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex" }}>
          <img
            alt=""
            src={userImage}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ),
      { ...size, fonts },
    );
  }

  const localeKey = locale as "en" | "ko";
  const categoryLabel =
    categoryLabels[post.category]?.[localeKey] ??
    categoryLabels[post.category]?.en ??
    post.category;

  const formattedDate = new Intl.DateTimeFormat(
    locale === "ko" ? "ko-KR" : "en-US",
    { year: "numeric", month: "short", day: "numeric" },
  ).format(new Date(post.publishedAt));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0A0A0B",
          padding: 80,
        }}
      >
        <div style={{ display: "flex" }}>
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 32,
              fontWeight: 700,
              fontFamily: "Geist",
            }}
          >
            TokFresh
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#FFFFFF",
              fontSize: 64,
              fontWeight: 700,
              fontFamily: "Geist",
              lineHeight: 1.1,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
            }}
          >
            {post.title}
          </div>

          <div
            style={{
              width: "100%",
              height: 1,
              backgroundColor: "#2A2A2E",
              marginTop: 32,
              marginBottom: 32,
            }}
          />

          <div style={{ display: "flex" }}>
            <span
              style={{
                color: "#8A8A8E",
                fontSize: 28,
                fontWeight: 400,
                fontFamily: "Geist",
              }}
            >
              {categoryLabel} &middot; {formattedDate}
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
