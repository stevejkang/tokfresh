import { cn } from "@/lib/utils";
import { PostsTabNav } from "@/components/posts/posts-tab-nav";

interface PostsSectionHeaderProps {
  title: string;
  rightSlot?: React.ReactNode;
  className?: string;
}

export function PostsSectionHeader({
  title,
  rightSlot,
  className,
}: PostsSectionHeaderProps) {
  return (
    <div className={cn(className)}>
      <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        {title}
      </h1>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <PostsTabNav />
        {rightSlot}
      </div>
    </div>
  );
}
