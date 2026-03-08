import { Module } from '@nestjs/common';
import { RssService } from './rss.service.js';
import { RssController } from './rss.controller.js';

@Module({
  controllers: [RssController],
  providers: [RssService],
})
export class RssModule {}
