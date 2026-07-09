export type PostCategory = 'product-updates' | 'announcements' | 'blog';

export interface PostFrontmatter {
  title: string;
  description: string; // doubles as SEO meta description + search excerpt
  category: PostCategory;
  author: string;
  publishedAt: string; // ISO date YYYY-MM-DD
  updatedAt?: string;
  heroImage?: string; // path relative to /public
  ogImage?: string; // defaults to heroImage if not set
  draft?: boolean; // true = excluded from builds
}

export interface Post extends PostFrontmatter {
  slug: string;
  locale: string;
  content: string; // raw MDX string (body, frontmatter stripped)
}
