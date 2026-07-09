import { setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/site-header";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function PostsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader showGitHubStars={false} />
      {children}
    </div>
  );
}
