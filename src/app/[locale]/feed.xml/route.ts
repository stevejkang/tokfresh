import { getAllPosts } from "@/lib/posts";
import { routing } from "@/i18n/routing";

const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const siteDescriptions: Record<string, string> = {
  en: "Automate your Claude Pro/Max token reset timing with Cloudflare Workers. Schedule 5-hour cycles to align with your workday. Free, secure, 24/7 automatic.",
  ko: "Cloudflare Workers로 Claude Pro/Max 토큰 리셋 타이밍을 자동화하세요. 5시간 주기를 업무 시간에 맞춰 설정할 수 있습니다. 무료, 보안, 24시간 자동 실행.",
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const posts = getAllPosts(locale);
  const description = siteDescriptions[locale] || siteDescriptions.en;

  const lastBuildDate =
    posts.length > 0
      ? new Date(posts[0].publishedAt).toUTCString()
      : new Date().toUTCString();

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${baseUrl}/${locale}/posts/${post.slug}</link>
      <guid>${baseUrl}/${locale}/posts/${post.slug}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <category>${escapeXml(post.category)}</category>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TokFresh</title>
    <link>${baseUrl}/${locale}</link>
    <description>${escapeXml(description)}</description>
    <language>${locale}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/${locale}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
