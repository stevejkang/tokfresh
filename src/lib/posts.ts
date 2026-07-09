import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Post, PostCategory } from '@/types/post';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const VALID_CATEGORIES: PostCategory[] = [
  'product-updates',
  'announcements',
  'blog',
];
const REQUIRED_FIELDS = [
  'title',
  'description',
  'category',
  'author',
  'publishedAt',
] as const;

function parsePost(slug: string, locale: string, filePath: string): Post {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) {
      throw new Error(
        `Missing required frontmatter field "${field}" in ${filePath}`,
      );
    }
  }

  if (!VALID_CATEGORIES.includes(data.category as PostCategory)) {
    throw new Error(
      `Invalid category "${data.category}" in ${filePath}. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
    );
  }

  return {
    slug,
    locale,
    content,
    title: data.title as string,
    description: data.description as string,
    category: data.category as PostCategory,
    author: data.author as string,
    publishedAt: data.publishedAt as string,
    updatedAt: (data.updatedAt as string) ?? undefined,
    heroImage: (data.heroImage as string) ?? undefined,
    ogImage: (data.ogImage as string) ?? undefined,
    draft: (data.draft as boolean) ?? undefined,
  };
}

function getPostsDirEntries(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

export function getAllPosts(locale: string): Post[] {
  const slugs = getPostsDirEntries();
  const posts: Post[] = [];

  for (const slug of slugs) {
    const filePath = path.join(POSTS_DIR, slug, `${locale}.mdx`);
    if (!fs.existsSync(filePath)) continue;

    const post = parsePost(slug, locale, filePath);
    if (post.draft) continue;

    posts.push(post);
  }

  return posts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getPostBySlug(slug: string, locale: string): Post | null {
  const filePath = path.join(POSTS_DIR, slug, `${locale}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  return parsePost(slug, locale, filePath);
}

export function getPostsByCategory(
  locale: string,
  categories: PostCategory[],
): Post[] {
  return getAllPosts(locale).filter((post) =>
    categories.includes(post.category),
  );
}

export function getAllSlugs(): string[] {
  return getPostsDirEntries();
}
