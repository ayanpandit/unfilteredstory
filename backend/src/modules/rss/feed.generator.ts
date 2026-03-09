/**
 * Professional RSS 2.0, Atom 1.0, and JSON Feed 1.1 generator.
 * Zero dependencies — full W3C-compliant XML generation.
 */

// ── Types ──────────────────────────────────────────────────────

export interface FeedOptions {
  id: string;
  title: string;
  description: string;
  link: string;
  language: string;
  copyright: string;
  updated: Date;
  generator: string;
  ttl: number;
  image?: string;
  favicon?: string;
  feedLinks: {
    rss: string;
    atom: string;
    json: string;
  };
  author: {
    name: string;
    email?: string;
    link?: string;
  };
}

export interface FeedItem {
  id: string;
  title: string;
  link: string;
  description: string;
  content: string;
  date: Date;
  published: Date;
  author: { name: string; link?: string };
  categories: { name: string; domain?: string }[];
  image?: string;
}

// ── XML Escape ─────────────────────────────────────────────────

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdata(str: string): string {
  // Close any accidental ]]> in content
  return `<![CDATA[${str.replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;
}

function rfc822(date: Date): string {
  return date.toUTCString();
}

function iso8601(date: Date): string {
  return date.toISOString();
}

// ── RSS 2.0 Generator ─────────────────────────────────────────

export function generateRss2(opts: FeedOptions, items: FeedItem[]): string {
  const itemsXml = items
    .map((item) => {
      const cats = item.categories
        .map((c) => `      <category${c.domain ? ` domain="${esc(c.domain)}"` : ''}>${esc(c.name)}</category>`)
        .join('\n');

      return `    <item>
      <title>${esc(item.title)}</title>
      <link>${esc(item.link)}</link>
      <guid isPermaLink="true">${esc(item.id)}</guid>
      <description>${esc(item.description)}</description>
      <content:encoded>${cdata(item.content)}</content:encoded>
      <dc:creator>${esc(item.author.name)}</dc:creator>
      <pubDate>${rfc822(item.published)}</pubDate>
${cats}${item.image ? `\n      <enclosure url="${esc(item.image)}" type="image/jpeg" length="0" />` : ''}
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:sy="http://purl.org/rss/1.0/modules/syndication/">
  <channel>
    <title>${esc(opts.title)}</title>
    <link>${esc(opts.link)}</link>
    <description>${esc(opts.description)}</description>
    <language>${esc(opts.language)}</language>
    <copyright>${esc(opts.copyright)}</copyright>
    <lastBuildDate>${rfc822(opts.updated)}</lastBuildDate>
    <generator>${esc(opts.generator)}</generator>
    <ttl>${opts.ttl}</ttl>
    <sy:updatePeriod>hourly</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
    <atom:link href="${esc(opts.feedLinks.rss)}" rel="self" type="application/rss+xml" />
    <atom:link href="${esc(opts.feedLinks.atom)}" rel="alternate" type="application/atom+xml" />
${opts.image ? `    <image>
      <url>${esc(opts.image)}</url>
      <title>${esc(opts.title)}</title>
      <link>${esc(opts.link)}</link>
    </image>` : ''}
${itemsXml}
  </channel>
</rss>`;
}

// ── Atom 1.0 Generator ────────────────────────────────────────

export function generateAtom(opts: FeedOptions, items: FeedItem[]): string {
  const entriesXml = items
    .map((item) => {
      const cats = item.categories
        .map((c) => `    <category term="${esc(c.name)}"${c.domain ? ` scheme="${esc(c.domain)}"` : ''} />`)
        .join('\n');

      return `  <entry>
    <id>${esc(item.id)}</id>
    <title type="html">${esc(item.title)}</title>
    <link href="${esc(item.link)}" rel="alternate" type="text/html" />
    <published>${iso8601(item.published)}</published>
    <updated>${iso8601(item.date)}</updated>
    <summary type="html">${esc(item.description)}</summary>
    <content type="html">${cdata(item.content)}</content>
    <author>
      <name>${esc(item.author.name)}</name>${item.author.link ? `\n      <uri>${esc(item.author.link)}</uri>` : ''}
    </author>
${cats}
  </entry>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${esc(opts.id)}</id>
  <title>${esc(opts.title)}</title>
  <subtitle>${esc(opts.description)}</subtitle>
  <link href="${esc(opts.link)}" rel="alternate" type="text/html" />
  <link href="${esc(opts.feedLinks.atom)}" rel="self" type="application/atom+xml" />
  <link href="${esc(opts.feedLinks.rss)}" rel="alternate" type="application/rss+xml" />
  <link href="${esc(opts.feedLinks.json)}" rel="alternate" type="application/feed+json" />
  <updated>${iso8601(opts.updated)}</updated>
  <rights>${esc(opts.copyright)}</rights>
  <generator>${esc(opts.generator)}</generator>
  <author>
    <name>${esc(opts.author.name)}</name>${opts.author.email ? `\n    <email>${esc(opts.author.email)}</email>` : ''}${opts.author.link ? `\n    <uri>${esc(opts.author.link)}</uri>` : ''}
  </author>
${opts.favicon ? `  <icon>${esc(opts.favicon)}</icon>` : ''}
${opts.image ? `  <logo>${esc(opts.image)}</logo>` : ''}
${entriesXml}
</feed>`;
}

// ── JSON Feed 1.1 Generator ───────────────────────────────────

export function generateJsonFeed(opts: FeedOptions, items: FeedItem[]): string {
  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: opts.title,
    home_page_url: opts.link,
    feed_url: opts.feedLinks.json,
    description: opts.description,
    icon: opts.image || undefined,
    favicon: opts.favicon || undefined,
    language: opts.language,
    authors: [
      {
        name: opts.author.name,
        url: opts.author.link || undefined,
      },
    ],
    items: items.map((item) => ({
      id: item.id,
      url: item.link,
      title: item.title,
      summary: item.description,
      content_html: item.content,
      date_published: iso8601(item.published),
      date_modified: iso8601(item.date),
      authors: [
        {
          name: item.author.name,
          url: item.author.link || undefined,
        },
      ],
      tags: item.categories.map((c) => c.name),
      image: item.image || undefined,
    })),
  };

  return JSON.stringify(feed, null, 2);
}
