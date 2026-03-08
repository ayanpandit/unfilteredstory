const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

async function apiFetch<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  content: any;
  status: string;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  author: { id: string; name: string; username: string };
  category: { id: string; name: string; slug: string };
  tags: { id: string; name: string; slug: string }[];
}

export interface PaginatedArticles {
  data: Article[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function getPublicArticles(params: Record<string, string> = {}): Promise<PaginatedArticles> {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/articles${qs ? `?${qs}` : ''}`);
}

export async function getArticleBySlug(slug: string): Promise<Article> {
  return apiFetch(`/articles/slug/${slug}`);
}

export async function getCategories() {
  return apiFetch<{ id: string; name: string; slug: string; _count?: { articles: number } }[]>('/categories');
}

export async function getTags() {
  return apiFetch<{ id: string; name: string; slug: string; _count?: { articles: number } }[]>('/tags');
}
