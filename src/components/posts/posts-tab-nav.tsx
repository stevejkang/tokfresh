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
        "flex w-full items-center justify-between gap-4",
        className,
      )}
    >
      <div className="flex items-center gap-1">
        {tabs.map(({ href, labelKey }) => {
          const isActive =
            pathname === href ||
            (href !== "/posts" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative px-3 py-2 text-sm transition-colors duration-200",
                isActive
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(labelKey)}
              {isActive && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 bg-foreground" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
