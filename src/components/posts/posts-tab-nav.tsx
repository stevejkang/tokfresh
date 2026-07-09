"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/i18n/navigation";

const tabs = [
  { href: "/posts", labelKey: "allPosts" },
  { href: "/changelog", labelKey: "changelog" },
  { href: "/news", labelKey: "news" },
] as const;

export function PostsTabNav({ className }: { className?: string }) {
  const t = useTranslations("Posts");
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex w-full items-center justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        {tabs.map(({ href, labelKey }) => {
          const isActive =
            pathname === href ||
            (href !== "/posts" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-base transition-colors duration-200",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
