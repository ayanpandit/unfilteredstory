import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class RssService {
  private readonly logger = new Logger(RssService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async generateMainFeed(): Promise<string> {
    const articles = await this.prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });

    const siteUrl = this.configService.get<string>('app.corsOrigin', 'http://localhost:3002').split(',')[0];

    return this.buildFeedXml({
      title: 'UnfilterStory — Raw Startup Intelligence',
      description: "No fluff. No bias. Just raw insights into India's most ambitious startups, their funding, and the stories that matter.",
      link: siteUrl,
      articles,
      siteUrl,
    });
  }

  async generateCategoryFeed(categorySlug: string): Promise<string> {
    const category = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) return '';

    const articles = await this.prisma.article.findMany({
      where: { status: 'PUBLISHED', categoryId: category.id },
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 30,
    });

    const siteUrl = this.configService.get<string>('app.corsOrigin', 'http://localhost:3002').split(',')[0];

    return this.buildFeedXml({
      title: `UnfilterStory — ${category.name}`,
      description: category.description || `Latest ${category.name} articles from UnfilterStory`,
      link: `${siteUrl}/category/${category.slug}`,
      articles,
      siteUrl,
    });
  }

  private buildFeedXml(opts: {
    title: string;
    description: string;
    link: string;
    articles: any[];
    siteUrl: string;
  }): string {
    const { title, description, link, articles, siteUrl } = opts;
    const now = new Date().toUTCString();

    const items = articles
      .map((a) => {
        const pubDate = a.publishedAt ? new Date(a.publishedAt).toUTCString() : now;
        const articleUrl = `${siteUrl}/article/${this.escapeXml(a.slug)}`;

        return `    <item>
      <title>${this.escapeXml(a.title)}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <description>${this.escapeXml(a.excerpt || '')}</description>
      <author>${this.escapeXml(a.author?.name || 'UnfilterStory')}</author>
      <category>${this.escapeXml(a.category?.name || '')}</category>
      <pubDate>${pubDate}</pubDate>${a.featuredImage ? `\n      <enclosure url="${this.escapeXml(a.featuredImage)}" type="image/jpeg" />` : ''}
    </item>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${this.escapeXml(title)}</title>
    <link>${this.escapeXml(link)}</link>
    <description>${this.escapeXml(description)}</description>
    <language>en-in</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${this.escapeXml(link)}/rss" rel="self" type="application/rss+xml"/>
    <image>
      <url>${this.escapeXml(siteUrl)}/icon.png</url>
      <title>${this.escapeXml(title)}</title>
      <link>${this.escapeXml(link)}</link>
    </image>
${items}
  </channel>
</rss>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
