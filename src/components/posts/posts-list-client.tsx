"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { Post } from "@/types/post";
import { PostsSectionHeader } from "@/components/posts/posts-section-header";
import { SearchInput } from "@/components/posts/search-input";
import { PostListItem } from "@/components/posts/post-list-item";

export function PostsListClient({ posts, title }: { posts: Post[]; title: string }) {
  const t = useTranslations("Posts");
  const [filtered, setFiltered] = useState<Post[] | null>(null);

  const displayPosts = filtered ?? posts;

  return (
    <>
      <PostsSectionHeader
        title={title}
        className="mb-10"
        rightSlot={
          <SearchInput
            posts={posts}
            onResultsChange={setFiltered}
            className="w-full sm:w-64"
          />
        }
      />

      {displayPosts.length > 0 ? (
        <div className="flex flex-col">
          {displayPosts.map((post) => (
            <PostListItem key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          {t("noResults")}
        </p>
      )}
    </>
  );
}
