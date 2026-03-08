import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { RssService } from './rss.service.js';
import { Public } from '../../common/decorators/index.js';

@ApiTags('RSS')
@Controller('rss')
export class RssController {
  constructor(private readonly rssService: RssService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get main RSS feed' })
  @ApiResponse({ status: 200, description: 'RSS XML feed' })
  async getMainFeed(@Res() res: any) {
    const xml = await this.rssService.generateMainFeed();
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=300');
    res.send(xml);
  }

  @Public()
  @Get('category/:slug')
  @ApiOperation({ summary: 'Get category RSS feed' })
  @ApiResponse({ status: 200, description: 'RSS XML feed for category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryFeed(@Param('slug') slug: string, @Res() res: any) {
    const xml = await this.rssService.generateCategoryFeed(slug);
    if (!xml) {
      throw new NotFoundException(`Category "${slug}" not found`);
    }
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=300');
    res.send(xml);
  }
}
