import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import type { Post } from "@/types/post";

export function PostCard({
  post,
  className,
}: {
  post: Post;
  className?: string;
}) {
  const format = useFormatter();
  const t = useTranslations("Posts");

  const formattedDate = format.dateTime(new Date(post.publishedAt), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link
      href={`/posts/${post.slug}`}
      className={cn("group block", className)}
    >
      <article className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-lg border border-border">
          <Image
            src={post.heroImage ?? `/${post.locale}/posts/${post.slug}/og`}
            alt={post.title}
            width={1200}
            height={630}
            unoptimized={!post.heroImage}
            className="aspect-[1200/630] w-full object-cover transition-opacity duration-200 group-hover:opacity-90"
          />
        </div>

        <h3 className="text-base font-semibold text-foreground transition-colors duration-200 group-hover:text-muted-foreground">
          {post.title}
        </h3>

        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {post.description}
        </p>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{post.author}</span>
          <span aria-hidden="true">&middot;</span>
          <time dateTime={post.publishedAt}>{formattedDate}</time>
        </div>
      </article>
    </Link>
  );
}
