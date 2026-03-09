import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  generateRss2,
  generateAtom,
  generateJsonFeed,
  FeedOptions,
  FeedItem,
} from './feed.generator.js';

// ── Types ──────────────────────────────────────────────────────
interface FeedMeta {
  title: string;
  description: string;
  link: string;
  feedPath: string;
  image?: string;
}

interface FeedResult {
  rss2: string;
  atom: string;
  json: string;
}

interface ArticleWithRelations {
  id: string;
  title: string;
  slug: string;
  content: any;
  excerpt: string;
  featuredImage: string | null;
  status: string;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: { name: string; username: string };
  category: { name: string; slug: string };
  tags: { tag: { name: string; slug: string } }[];
}

@Injectable()
export class RssService {
  private readonly logger = new Logger(RssService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ── Helpers ────────────────────────────────────────────────────

  private get siteUrl(): string {
    return this.config.get<string>('feed.siteUrl', 'http://localhost:3002');
  }

  private get feedBaseUrl(): string {
    const explicit = this.config.get<string>('feed.feedBaseUrl', '');
    if (explicit) return explicit;
    const port = this.config.get<number>('app.port', 3000);
    const nodeEnv = this.config.get<string>('app.nodeEnv', 'development');
    if (nodeEnv === 'production') {
      return this.siteUrl.replace(/\/$/, '');
    }
    return `http://localhost:${port}/api/v1`;
  }

  private get maxItems(): number {
    return this.config.get<number>('feed.maxItems', 50);
  }

  private get feedTtl(): number {
    return this.config.get<number>('feed.ttl', 60);
  }

  private get siteCopyright(): string {
    return this.config.get<string>('feed.copyright', `© ${new Date().getFullYear()} UnfilterStory`);
  }

  private articleUrl(slug: string): string {
    return `${this.siteUrl}/article/${slug}`;
  }

  private feedUrl(path: string): string {
    return `${this.feedBaseUrl}/rss${path}`;
  }

  // ── Core Feed Builder ──────────────────────────────────────────

  private buildFeed(meta: FeedMeta, articles: ArticleWithRelations[]): FeedResult {
    const now = new Date();
    const authorName = this.config.get<string>('feed.authorName', 'UnfilterStory Editorial');
    const authorEmail = this.config.get<string>('feed.authorEmail', 'editorial@unfilterstory.com');
    const language = this.config.get<string>('feed.language', 'en');

    const opts: FeedOptions = {
      id: `${this.siteUrl}/`,
      title: meta.title,
      description: meta.description,
      link: meta.link,
      language,
      image: meta.image || `${this.siteUrl}/icon.png`,
      favicon: `${this.siteUrl}/favicon.ico`,
      copyright: this.siteCopyright,
      updated: articles.length > 0
        ? new Date(articles[0].publishedAt || articles[0].updatedAt)
        : now,
      generator: 'UnfilterStory Feed Engine',
      feedLinks: {
        rss: this.feedUrl(meta.feedPath || ''),
        atom: this.feedUrl(`${meta.feedPath || ''}/atom`),
        json: this.feedUrl(`${meta.feedPath || ''}/json`),
      },
      author: { name: authorName, email: authorEmail, link: this.siteUrl },
      ttl: this.feedTtl,
    };

    const items: FeedItem[] = articles.map((article) => {
      const url = this.articleUrl(article.slug);
      const published = article.publishedAt ? new Date(article.publishedAt) : new Date(article.createdAt);
      const updated = new Date(article.updatedAt);

      const contentHtml = this.jsonContentToHtml(article.content);
      const categories = [
        { name: article.category.name, domain: `${this.siteUrl}/category/${article.category.slug}` },
        ...article.tags.map((t) => ({
          name: t.tag.name,
          domain: `${this.siteUrl}/tag/${t.tag.slug}`,
        })),
      ];

      return {
        id: url,
        title: article.title,
        link: url,
        description: article.excerpt,
        content: contentHtml,
        date: updated,
        published,
        author: {
          name: article.author.name,
          link: `${this.siteUrl}/author/${article.author.username}`,
        },
        categories,
        image: article.featuredImage || undefined,
      };
    });

    return {
      rss2: generateRss2(opts, items),
      atom: generateAtom(opts, items),
      json: generateJsonFeed(opts, items),
    };
  }

  /**
   * Convert Prisma JSON content (TipTap/ProseMirror or plain string) to HTML.
   */
  private jsonContentToHtml(content: any): string {
    if (!content) return '';
    if (typeof content === 'string') return `<p>${this.escapeHtml(content)}</p>`;

    // TipTap/ProseMirror format: { type: "doc", content: [...] }
    if (content.type === 'doc' && Array.isArray(content.content)) {
      return content.content.map((node: any) => this.renderNode(node)).join('');
    }

    // Simple { text: "..." } format from the CMS editor
    if (typeof content.text === 'string') {
      return content.text
        .split(/\n{2,}/)
        .filter((p: string) => p.trim())
        .map((p: string) => `<p>${this.escapeHtml(p.trim())}</p>`)
        .join('\n');
    }

    return this.escapeHtml(JSON.stringify(content));
  }

  private renderNode(node: any): string {
    if (!node) return '';

    switch (node.type) {
      case 'paragraph':
        return `<p>${this.renderChildren(node)}</p>`;
      case 'heading': {
        const level = node.attrs?.level || 2;
        return `<h${level}>${this.renderChildren(node)}</h${level}>`;
      }
      case 'bulletList':
        return `<ul>${this.renderChildren(node)}</ul>`;
      case 'orderedList':
        return `<ol>${this.renderChildren(node)}</ol>`;
      case 'listItem':
        return `<li>${this.renderChildren(node)}</li>`;
      case 'blockquote':
        return `<blockquote>${this.renderChildren(node)}</blockquote>`;
      case 'codeBlock':
        return `<pre><code>${this.renderChildren(node)}</code></pre>`;
      case 'image':
        return `<img src="${this.escapeHtml(node.attrs?.src || '')}" alt="${this.escapeHtml(node.attrs?.alt || '')}" />`;
      case 'horizontalRule':
        return '<hr />';
      case 'hardBreak':
        return '<br />';
      case 'text': {
        let text = this.escapeHtml(node.text || '');
        if (node.marks) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case 'bold':
              case 'strong':
                text = `<strong>${text}</strong>`;
                break;
              case 'italic':
              case 'em':
                text = `<em>${text}</em>`;
                break;
              case 'code':
                text = `<code>${text}</code>`;
                break;
              case 'link':
                text = `<a href="${this.escapeHtml(mark.attrs?.href || '')}">${text}</a>`;
                break;
              case 'underline':
                text = `<u>${text}</u>`;
                break;
              case 'strike':
                text = `<s>${text}</s>`;
                break;
            }
          }
        }
        return text;
      }
      default:
        return this.renderChildren(node);
    }
  }

  private renderChildren(node: any): string {
    if (!node.content || !Array.isArray(node.content)) return '';
    return node.content.map((child: any) => this.renderNode(child)).join('');
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Data Fetchers ──────────────────────────────────────────────

  private async fetchPublishedArticles(
    where: Record<string, any> = {},
    take?: number,
  ): Promise<ArticleWithRelations[]> {
    return this.prisma.article.findMany({
      where: { status: 'PUBLISHED', ...where },
      include: {
        author: { select: { name: true, username: true } },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
      },
      orderBy: { publishedAt: 'desc' },
      take: take || this.maxItems,
    }) as unknown as ArticleWithRelations[];
  }

  // ── Public Feed Generators ─────────────────────────────────────

  /** Main site feed — all published articles */
  async generateMainFeed(): Promise<FeedResult> {
    const articles = await this.fetchPublishedArticles();
    const title = this.config.get<string>('feed.title', 'UnfilterStory');
    const subtitle = this.config.get<string>('feed.subtitle', 'Raw Startup Intelligence');

    return this.buildFeed(
      { title, description: subtitle, link: this.siteUrl, feedPath: '' },
      articles,
    );
  }

  /** Category-specific feed */
  async generateCategoryFeed(slug: string): Promise<FeedResult> {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    if (!category) throw new NotFoundException(`Category "${slug}" not found`);

    const articles = await this.fetchPublishedArticles({ categoryId: category.id }, 30);

    return this.buildFeed(
      {
        title: `${this.config.get<string>('feed.title', 'UnfilterStory')} — ${category.name}`,
        description: category.description || `Latest ${category.name} articles`,
        link: `${this.siteUrl}/category/${category.slug}`,
        feedPath: `/category/${category.slug}`,
      },
      articles,
    );
  }

  /** Tag-specific feed */
  async generateTagFeed(slug: string): Promise<FeedResult> {
    const tag = await this.prisma.tag.findUnique({ where: { slug } });
    if (!tag) throw new NotFoundException(`Tag "${slug}" not found`);

    const articles = await this.fetchPublishedArticles(
      { tags: { some: { tagId: tag.id } } },
      30,
    );

    return this.buildFeed(
      {
        title: `${this.config.get<string>('feed.title', 'UnfilterStory')} — #${tag.name}`,
        description: `Articles tagged with "${tag.name}"`,
        link: `${this.siteUrl}/tag/${tag.slug}`,
        feedPath: `/tag/${tag.slug}`,
      },
      articles,
    );
  }

  /** Author-specific feed */
  async generateAuthorFeed(username: string): Promise<FeedResult> {
    const author = await this.prisma.user.findUnique({ where: { username } });
    if (!author) throw new NotFoundException(`Author "${username}" not found`);

    const articles = await this.fetchPublishedArticles({ authorId: author.id }, 30);

    return this.buildFeed(
      {
        title: `${this.config.get<string>('feed.title', 'UnfilterStory')} — ${author.name}`,
        description: `Articles by ${author.name}`,
        link: `${this.siteUrl}/author/${author.username}`,
        feedPath: `/author/${author.username}`,
      },
      articles,
    );
  }

  // ── Sitemap ────────────────────────────────────────────────────

  async generateSitemap(): Promise<string> {
    const [articles, categories, tags] = await Promise.all([
      this.prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
      this.prisma.tag.findMany({ select: { slug: true, updatedAt: true } }),
    ]);

    const urls: string[] = [];

    urls.push(this.sitemapUrl(this.siteUrl, new Date(), 'daily', '1.0'));

    for (const a of articles) {
      const lastmod = a.updatedAt || a.publishedAt || new Date();
      urls.push(this.sitemapUrl(`${this.siteUrl}/article/${a.slug}`, lastmod, 'weekly', '0.8'));
    }
    for (const c of categories) {
      urls.push(this.sitemapUrl(`${this.siteUrl}/category/${c.slug}`, c.updatedAt, 'weekly', '0.6'));
    }
    for (const t of tags) {
      urls.push(this.sitemapUrl(`${this.siteUrl}/tag/${t.slug}`, t.updatedAt, 'weekly', '0.5'));
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
  }

  private sitemapUrl(loc: string, lastmod: Date, changefreq: string, priority: string): string {
    return `  <url>
    <loc>${this.escapeHtml(loc)}</loc>
    <lastmod>${lastmod.toISOString().split('T')[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }

  // ── Feed Discovery ─────────────────────────────────────────────

  async getFeedDirectory(): Promise<object> {
    const [categories, tags] = await Promise.all([
      this.prisma.category.findMany({ select: { name: true, slug: true }, orderBy: { name: 'asc' } }),
      this.prisma.tag.findMany({ select: { name: true, slug: true }, orderBy: { name: 'asc' } }),
    ]);

    const base = this.feedUrl('');
    return {
      feeds: {
        main: {
          rss: base,
          atom: `${base}/atom`,
          json: `${base}/json`,
        },
        categories: categories.map((c) => ({
          name: c.name,
          slug: c.slug,
          rss: this.feedUrl(`/category/${c.slug}`),
          atom: this.feedUrl(`/category/${c.slug}/atom`),
          json: this.feedUrl(`/category/${c.slug}/json`),
        })),
        tags: tags.map((t) => ({
          name: t.name,
          slug: t.slug,
          rss: this.feedUrl(`/tag/${t.slug}`),
          atom: this.feedUrl(`/tag/${t.slug}/atom`),
          json: this.feedUrl(`/tag/${t.slug}/json`),
        })),
      },
      sitemap: `${this.feedBaseUrl}/sitemap.xml`,
    };
  }
}
