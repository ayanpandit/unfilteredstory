import {
  Controller,
  Get,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { RssService } from './rss.service.js';
import { Public } from '../../common/decorators/index.js';

// ── Helpers ────────────────────────────────────────────────────
const CACHE_SECONDS = 300; // 5 min
const STALE_SECONDS = 60;  // serve stale for 60s while revalidating

const CONTENT_TYPES = {
  rss: 'application/rss+xml; charset=utf-8',
  atom: 'application/atom+xml; charset=utf-8',
  json: 'application/feed+json; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
} as const;

function sendFeed(res: any, req: any, body: string, format: 'rss' | 'atom' | 'json') {
  const etag = `W/"${Buffer.byteLength(body).toString(36)}"`;

  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }

  res.set({
    'Content-Type': CONTENT_TYPES[format],
    'Cache-Control': `public, max-age=${CACHE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
    ETag: etag,
    'X-Content-Type-Options': 'nosniff',
    Vary: 'Accept',
  });
  res.send(body);
}

function sendXml(res: any, req: any, xml: string) {
  const etag = `W/"${Buffer.byteLength(xml).toString(36)}"`;
  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }
  res.set({
    'Content-Type': CONTENT_TYPES.xml,
    'Cache-Control': `public, max-age=3600, stale-while-revalidate=600`,
    ETag: etag,
    'X-Content-Type-Options': 'nosniff',
  });
  res.send(xml);
}

// ── Controller ─────────────────────────────────────────────────
@ApiTags('Feeds')
@Controller()
@SkipThrottle()
export class RssController {
  constructor(private readonly rssService: RssService) {}

  // ────────────────── Main Feeds ──────────────────

  @Public()
  @Get('rss')
  @ApiOperation({ summary: 'Main RSS 2.0 feed' })
  @ApiResponse({ status: 200, description: 'RSS 2.0 XML' })
  async mainRss(@Req() req: any, @Res() res: any) {
    const feed = await this.rssService.generateMainFeed();
    sendFeed(res, req, feed.rss2, 'rss');
  }

  @Public()
  @Get('rss/atom')
  @ApiOperation({ summary: 'Main Atom 1.0 feed' })
  @ApiResponse({ status: 200, description: 'Atom 1.0 XML' })
  async mainAtom(@Req() req: any, @Res() res: any) {
    const feed = await this.rssService.generateMainFeed();
    sendFeed(res, req, feed.atom, 'atom');
  }

  @Public()
  @Get('rss/json')
  @ApiOperation({ summary: 'Main JSON Feed 1.1' })
  @ApiResponse({ status: 200, description: 'JSON Feed' })
  async mainJson(@Req() req: any, @Res() res: any) {
    const feed = await this.rssService.generateMainFeed();
    sendFeed(res, req, feed.json, 'json');
  }

  // ────────────────── Category Feeds ──────────────────

  @Public()
  @Get('rss/category/:slug')
  @ApiOperation({ summary: 'Category RSS 2.0 feed' })
  @ApiParam({ name: 'slug', description: 'Category slug' })
  async categoryRss(@Param('slug') slug: string, @Req() req: any, @Res() res: any) {
    const feed = await this.rssService.generateCategoryFeed(slug);
    sendFeed(res, req, feed.rss2, 'rss');
  }

  @Public()
  @Get('rss/category/:slug/atom')
  @ApiOperation({ summary: 'Category Atom 1.0 feed' })
  @ApiParam({ name: 'slug', description: 'Category slug' })
  async categoryAtom(@Param('slug') slug: string, @Req() req: any, @Res() res: any) {
    const feed = await this.rssService.generateCategoryFeed(slug);
    sendFeed(res, req, feed.atom, 'atom');
  }

  @Public()
  @Get('rss/category/:slug/json')
  @ApiOperation({ summary: 'Category JSON Feed 1.1' })
  @ApiParam({ name: 'slug', description: 'Category slug' })
  async categoryJson(@Param('slug') slug: string, @Req() req: any, @Res() res: any) {
    const feed = await this.rssService.generateCategoryFeed(slug);
    sendFeed(res, req, feed.json, 'json');
  }

  // ────────────────── Tag Feeds ──────────────────

  @Public()
  @Get('rss/tag/:slug')
  @ApiOperation({ summary: 'Tag RSS 2.0 feed' })
  @ApiParam({ name: 'slug', description: 'Tag slug' })
  async tagRss(@Param('slug') slug: string, @Req() req: any, @Res() res: any) {
    const feed = await this.rssService.generateTagFeed(slug);
    sendFeed(res, req, feed.rss2, 'rss');
  }

  @Public()
  @Get('rss/tag/:slug/atom')
  @ApiOperation({ summary: 'Tag Atom 1.0 feed' })
  @ApiParam({ name: 'slug', description: 'Tag slug' })
  async tagAtom(@Param('slug') slug: string, @Req() req: any, @Res() res: any) {
    const feed = await this.rssService.generateTagFeed(slug);
    sendFeed(res, req, feed.atom, 'atom');
  }

  @Public()
  @Get('rss/tag/:slug/json')
  @ApiOperation({ summary: 'Tag JSON Feed 1.1' })
  @ApiParam({ name: 'slug', description: 'Tag slug' })
  async tagJson(@Param('slug') slug: string, @Req() req: any, @Res() res: any) {
    const feed = await this.rssService.generateTagFeed(slug);
    sendFeed(res, req, feed.json, 'json');
  }

  // ────────────────── Author Feeds ──────────────────

  @Public()
  @Get('rss/author/:username')
  @ApiOperation({ summary: 'Author RSS 2.0 feed' })
  @ApiParam({ name: 'username', description: 'Author username' })
  async authorRss(@Param('username') username: string, @Req() req: any, @Res() res: any) {
    const feed = await this.rssService.generateAuthorFeed(username);
    sendFeed(res, req, feed.rss2, 'rss');
  }

  @Public()
  @Get('rss/author/:username/atom')
  @ApiOperation({ summary: 'Author Atom 1.0 feed' })
  @ApiParam({ name: 'username', description: 'Author username' })
  async authorAtom(@Param('username') username: string, @Req() req: any, @Res() res: any) {
    const feed = await this.rssService.generateAuthorFeed(username);
    sendFeed(res, req, feed.atom, 'atom');
  }

  @Public()
  @Get('rss/author/:username/json')
  @ApiOperation({ summary: 'Author JSON Feed 1.1' })
  @ApiParam({ name: 'username', description: 'Author username' })
  async authorJson(@Param('username') username: string, @Req() req: any, @Res() res: any) {
    const feed = await this.rssService.generateAuthorFeed(username);
    sendFeed(res, req, feed.json, 'json');
  }

  // ────────────────── Feed Discovery ──────────────────

  @Public()
  @Get('rss/directory')
  @ApiOperation({ summary: 'Feed discovery — lists all available feeds' })
  @ApiResponse({ status: 200, description: 'Feed directory JSON' })
  async feedDirectory() {
    return this.rssService.getFeedDirectory();
  }

  // ────────────────── Sitemap ──────────────────

  @Public()
  @Get('sitemap.xml')
  @ApiOperation({ summary: 'XML Sitemap' })
  @ApiResponse({ status: 200, description: 'XML Sitemap' })
  async sitemap(@Req() req: any, @Res() res: any) {
    const xml = await this.rssService.generateSitemap();
    sendXml(res, req, xml);
  }
}
