import type { Post, PostCategory } from '@/types/post';
import { getAllPosts } from '@/lib/posts';

export interface SearchIndexEntry {
  slug: string;
  title: string;
  description: string;
  category: PostCategory;
}

export function buildSearchIndex(locale: string): SearchIndexEntry[] {
  const posts = getAllPosts(locale);
  return posts.map(({ slug, title, description, category }) => ({
    slug,
    title,
    description,
    category,
  }));
}
