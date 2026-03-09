import { Module } from '@nestjs/common';
import { RssService } from './rss.service.js';
import { RssController } from './rss.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [RssController],
  providers: [RssService],
  exports: [RssService],
})
export class RssModule {}
