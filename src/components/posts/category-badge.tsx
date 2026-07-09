import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { PostCategory } from "@/types/post";

const categoryTranslationKeys: Record<PostCategory, string> = {
  "product-updates": "categoryProductUpdates",
  announcements: "categoryAnnouncements",
  blog: "categoryBlog",
};

export function CategoryBadge({
  category,
  className,
}: {
  category: PostCategory;
  className?: string;
}) {
  const t = useTranslations("Posts");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground",
        className,
      )}
    >
      {t(categoryTranslationKeys[category])}
    </span>
  );
}
