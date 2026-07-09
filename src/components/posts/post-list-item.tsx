import { useFormatter } from "next-intl";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import type { Post } from "@/types/post";
import { CategoryBadge } from "@/components/posts/category-badge";

export function PostListItem({
  post,
  className,
}: {
  post: Post;
  className?: string;
}) {
  const format = useFormatter();

  const formattedDate = format.dateTime(new Date(post.publishedAt), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link
      href={`/posts/${post.slug}`}
      className={cn(
        "group -mx-3 flex items-center justify-between gap-4 rounded-md border-b border-border px-3 py-4 transition-colors duration-200 hover:bg-muted/50",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="truncate font-medium text-foreground">
          {post.title}
        </span>
        <CategoryBadge category={post.category} className="shrink-0" />
      </div>

      <time
        dateTime={post.publishedAt}
        className="shrink-0 text-sm text-muted-foreground"
      >
        {formattedDate}
      </time>
    </Link>
  );
}
