import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [
      totalArticles,
      totalPublished,
      totalDrafts,
      totalReview,
      totalArchived,
      totalUsers,
      totalCategories,
      totalTags,
      recentArticles,
      totalViewsResult,
    ] = await Promise.all([
      this.prisma.article.count(),
      this.prisma.article.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.article.count({ where: { status: 'DRAFT' } }),
      this.prisma.article.count({ where: { status: 'REVIEW' } }),
      this.prisma.article.count({ where: { status: 'ARCHIVED' } }),
      this.prisma.user.count(),
      this.prisma.category.count(),
      this.prisma.tag.count(),
      this.prisma.article.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          viewCount: true,
          createdAt: true,
          publishedAt: true,
          author: {
            select: { id: true, name: true, username: true },
          },
          category: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.article.aggregate({ _sum: { viewCount: true } }),
    ]);

    return {
      stats: {
        totalArticles,
        totalPublished,
        totalDrafts,
        totalReview,
        totalArchived,
        totalUsers,
        totalCategories,
        totalTags,
        totalViews: totalViewsResult._sum.viewCount || 0,
      },
      recentArticles,
    };
  }
}
