"use client";

import { useCallback, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type Fuse from "fuse.js";

import { cn } from "@/lib/utils";
import type { Post } from "@/types/post";

const FUSE_OPTIONS = {
  keys: ["title", "description"] as string[],
  threshold: 0.4,
  ignoreLocation: true,
};

interface SearchInputProps {
  posts: Post[];
  onResultsChange: (filteredPosts: Post[] | null) => void;
  className?: string;
}

export function SearchInput({
  posts,
  onResultsChange,
  className,
}: SearchInputProps) {
  const t = useTranslations("Posts");
  const [query, setQuery] = useState("");
  const fuseRef = useRef<Fuse<Post> | null>(null);
  const fusePromiseRef = useRef<Promise<Fuse<Post>> | null>(null);

  const ensureFuse = useCallback(async () => {
    if (fuseRef.current) return fuseRef.current;
    if (!fusePromiseRef.current) {
      fusePromiseRef.current = import("fuse.js").then(({ default: Fuse }) => {
        const instance = new Fuse(posts, FUSE_OPTIONS);
        fuseRef.current = instance;
        return instance;
      });
    }
    return fusePromiseRef.current;
  }, [posts]);

  const handleChange = useCallback(
    async (value: string) => {
      setQuery(value);

      if (!value.trim()) {
        onResultsChange(null);
        return;
      }

      await ensureFuse();

      if (fuseRef.current) {
        const results = fuseRef.current.search(value);
        onResultsChange(results.map((r) => r.item));
      }
    },
    [ensureFuse, onResultsChange],
  );

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={ensureFuse}
        placeholder={t("searchPlaceholder")}
        className={cn(
          "h-10 w-full rounded-full bg-muted pl-10 pr-4 text-sm",
          "text-foreground placeholder:text-muted-foreground",
          "outline-none transition-colors focus:ring-1 focus:ring-foreground/20",
        )}
      />
    </div>
  );
}
