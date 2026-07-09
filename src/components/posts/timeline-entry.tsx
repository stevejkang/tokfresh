import Image from "next/image";
import { useFormatter } from "next-intl";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import type { Post } from "@/types/post";

export function TimelineEntry({
  post,
  isFirst = false,
  className,
}: {
  post: Post;
  isFirst?: boolean;
  className?: string;
}) {
  const format = useFormatter();

  const formattedDate = format.dateTime(new Date(post.publishedAt), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article className={cn("relative", className)}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[180px_1fr] md:gap-10">
        <div className="relative flex items-start gap-3 md:flex-col md:items-end md:gap-0">
          <time
            dateTime={post.publishedAt}
            className="shrink-0 pt-1.5 text-sm text-muted-foreground md:pt-2 md:text-right"
          >
            {formattedDate}
          </time>

          <div
            className={cn(
              "mt-2.5 size-2 shrink-0 rounded-full md:absolute md:-right-[25px] md:top-[15px] md:mt-0",
              isFirst ? "bg-destructive" : "bg-border",
            )}
          />

          <div className="absolute -right-[21px] top-[23px] hidden h-[calc(100%+2rem)] w-px bg-border md:block" />
        </div>

        <div className="flex flex-col gap-4">
          <Link href={`/posts/${post.slug}`} className="group">
            <h2 className="text-2xl font-bold tracking-tight text-foreground transition-colors duration-200 group-hover:text-muted-foreground sm:text-3xl">
              {post.title}
            </h2>
          </Link>

          <p className="max-w-[65ch] leading-relaxed text-muted-foreground">
            {post.description}
          </p>

          {post.heroImage && (
            <div className="overflow-hidden rounded-lg border border-border">
              <Image
                src={post.heroImage}
                alt={post.title}
                width={1200}
                height={630}
                className="aspect-[1200/630] w-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
