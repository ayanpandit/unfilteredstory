import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateArticleDto, UpdateArticleDto, ArticleQueryDto } from './dto/index.js';
import { generateSlug } from '../../common/utils/slug.util.js';
import { SortOrder } from '../../common/utils/pagination.util.js';
import type { PaginatedResult } from '../../common/utils/pagination.util.js';
import { Role } from '@prisma/client';

const CACHE_TTL = 60 * 1000; // 60 seconds in ms
const CACHE_KEY_ARTICLES = 'articles:list';
const CACHE_KEY_ARTICLE_PREFIX = 'article:slug:';

interface CurrentUserPayload {
  userId: string;
  email: string;
  role: Role;
}

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  // ──────────────── Create ────────────────

  async create(dto: CreateArticleDto, user: CurrentUserPayload) {
    // Validate category exists
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new BadRequestException(
        `Category with ID "${dto.categoryId}" not found`,
      );
    }

    // Generate unique slug
    let slug = generateSlug(dto.title);
    const existingSlug = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Validate tags if provided
    if (dto.tagIds?.length) {
      const tags = await this.prisma.tag.findMany({
        where: { id: { in: dto.tagIds } },
      });

      if (tags.length !== dto.tagIds.length) {
        throw new BadRequestException('One or more tag IDs are invalid');
      }
    }

    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        slug,
        content: dto.content as any,
        excerpt: dto.excerpt,
        featuredImage: dto.featuredImage,
        status: 'DRAFT',
        authorId: user.userId,
        categoryId: dto.categoryId,
        tags: dto.tagIds?.length
          ? {
              create: dto.tagIds.map((tagId) => ({
                tagId,
              })),
            }
          : undefined,
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, email: true, role: true },
        },
        category: true,
        tags: {
          include: { tag: true },
        },
      },
    });

    this.logger.log(`Article created: "${article.title}" by ${user.email}`);

    return this.formatArticleResponse(article);
  }

  // ──────────────── Update ────────────────

  async update(
    id: string,
    dto: UpdateArticleDto,
    user: CurrentUserPayload,
  ) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }

    if (article.status === 'ARCHIVED') {
      throw new ForbiddenException('Cannot update an archived article');
    }

    // Only the author, EDITOR, or ADMIN can update
    if (
      article.authorId !== user.userId &&
      user.role !== Role.ADMIN &&
      user.role !== Role.EDITOR
    ) {
      throw new ForbiddenException('You do not have permission to update this article');
    }

    // Validate category if changing
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException(
          `Category with ID "${dto.categoryId}" not found`,
        );
      }
    }

    // Handle slug update if title is changing
    const data: any = { ...dto };
    delete data.tagIds;

    if (dto.title && dto.title !== article.title) {
      let newSlug = generateSlug(dto.title);
      const existingSlug = await this.prisma.article.findFirst({
        where: { slug: newSlug, NOT: { id } },
      });
      if (existingSlug) {
        newSlug = `${newSlug}-${Date.now().toString(36)}`;
      }
      data.slug = newSlug;
    }

    // Handle tags
    if (dto.tagIds !== undefined) {
      // Validate tags
      if (dto.tagIds.length) {
        const tags = await this.prisma.tag.findMany({
          where: { id: { in: dto.tagIds } },
        });
        if (tags.length !== dto.tagIds.length) {
          throw new BadRequestException('One or more tag IDs are invalid');
        }
      }

      // Delete existing tags and recreate
      await this.prisma.articleTag.deleteMany({
        where: { articleId: id },
      });

      data.tags = {
        create: dto.tagIds.map((tagId) => ({ tagId })),
      };
    }

    const updatedArticle = await this.prisma.article.update({
      where: { id },
      data,
      include: {
        author: {
          select: { id: true, name: true, username: true, email: true, role: true },
        },
        category: true,
        tags: { include: { tag: true } },
      },
    });

    // Invalidate caches
    await this.invalidateCache(article.slug);
    if (data.slug && data.slug !== article.slug) {
      await this.invalidateCache(data.slug);
    }

    this.logger.log(`Article updated: "${updatedArticle.title}"`);

    return this.formatArticleResponse(updatedArticle);
  }

  // ──────────────── Publish ────────────────

  async publish(id: string, user: CurrentUserPayload) {
    if (user.role !== Role.ADMIN && user.role !== Role.EDITOR) {
      throw new ForbiddenException('Only EDITOR or ADMIN can publish articles');
    }

    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }

    if (article.status === 'ARCHIVED') {
      throw new ForbiddenException('Cannot publish an archived article');
    }

    const published = await this.prisma.article.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, email: true, role: true },
        },
        category: true,
        tags: { include: { tag: true } },
      },
    });

    // Invalidate caches
    await this.invalidateCache(article.slug);
    await this.invalidateListCache();

    this.logger.log(`Article published: "${published.title}"`);

    return this.formatArticleResponse(published);
  }

  // ──────────────── Archive ────────────────

  async archive(id: string, user: CurrentUserPayload) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only ADMIN can archive articles');
    }

    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }

    const archived = await this.prisma.article.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, email: true, role: true },
        },
        category: true,
        tags: { include: { tag: true } },
      },
    });

    await this.invalidateCache(article.slug);
    await this.invalidateListCache();

    this.logger.log(`Article archived: "${archived.title}"`);

    return this.formatArticleResponse(archived);
  }

  // ──────────────── Unarchive ────────────────

  async unarchive(id: string, user: CurrentUserPayload) {
    if (user.role !== Role.ADMIN && user.role !== Role.EDITOR) {
      throw new ForbiddenException('Only ADMIN or EDITOR can unarchive articles');
    }

    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }

    if (article.status !== 'ARCHIVED') {
      throw new BadRequestException('Article is not archived');
    }

    const unarchived = await this.prisma.article.update({
      where: { id },
      data: {
        status: 'DRAFT',
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, email: true, role: true },
        },
        category: true,
        tags: { include: { tag: true } },
      },
    });

    await this.invalidateCache(article.slug);
    await this.invalidateListCache();

    this.logger.log(`Article unarchived: "${unarchived.title}"`);

    return this.formatArticleResponse(unarchived);
  }

  // ──────────────── Get Public Articles (paginated/filtered) ────────────────

  async findPublic(query: ArticleQueryDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      search,
      sort = SortOrder.NEWEST,
      categoryId,
      tagId,
      category,
      tag,
      dateFrom,
      dateTo,
    } = query;

    // Try cache for default queries
    const cacheKey = `${CACHE_KEY_ARTICLES}:${JSON.stringify(query)}`;

    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return JSON.parse(cached);
    }

    const skip = (page - 1) * limit;

    const where: any = {
      status: 'PUBLISHED',
    };

    // Search in title & excerpt
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    } else if (category) {
      where.category = { slug: category };
    }

    // Tag filter
    if (tagId) {
      where.tags = { some: { tagId } };
    } else if (tag) {
      where.tags = { some: { tag: { slug: tag } } };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.publishedAt = {};
      if (dateFrom) where.publishedAt.gte = new Date(dateFrom);
      if (dateTo) where.publishedAt.lte = new Date(dateTo);
    }

    // Sorting
    let orderBy: any;
    switch (sort) {
      case SortOrder.OLDEST:
        orderBy = { publishedAt: 'asc' };
        break;
      case SortOrder.MOST_VIEWED:
        orderBy = { viewCount: 'desc' };
        break;
      case SortOrder.NEWEST:
      default:
        orderBy = { publishedAt: 'desc' };
        break;
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          tags: {
            include: {
              tag: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.article.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const result: PaginatedResult<any> = {
      data: articles.map((a) => this.formatArticleResponse(a)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };

    // Store in cache
    await this.cacheManager.set(cacheKey, JSON.stringify(result), CACHE_TTL);

    return result;
  }

  // ──────────────── Get Article by Slug ────────────────

  async findBySlug(slug: string) {
    const cacheKey = `${CACHE_KEY_ARTICLE_PREFIX}${slug}`;

    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      // Increment view count asynchronously
      this.incrementViewCount(slug);
      return JSON.parse(cached);
    }

    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: { id: true, name: true, username: true },
        },
        category: true,
        tags: {
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!article || article.status !== 'PUBLISHED') {
      throw new NotFoundException(`Article with slug "${slug}" not found`);
    }

    // Increment view count
    await this.incrementViewCount(slug);

    const formatted = this.formatArticleResponse(article);

    // Cache
    await this.cacheManager.set(cacheKey, JSON.stringify(formatted), CACHE_TTL);

    return formatted;
  }

  // ──────────────── Get all articles (admin/editor view) ────────────────

  async findAll(query: ArticleQueryDto, user: CurrentUserPayload): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sort = SortOrder.NEWEST } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Reporters can only see their own articles
    if (user.role === Role.REPORTER) {
      where.authorId = user.userId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.status) {
      where.status = query.status;
    }

    let orderBy: any;
    switch (sort) {
      case SortOrder.OLDEST:
        orderBy = { createdAt: 'asc' };
        break;
      case SortOrder.MOST_VIEWED:
        orderBy = { viewCount: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, username: true, email: true, role: true },
          },
          category: true,
          tags: { include: { tag: true } },
        },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.article.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: articles.map((a) => this.formatArticleResponse(a)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  // ──────────────── Get single article by ID (admin view) ────────────────

  async findOneById(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, username: true, email: true, role: true },
        },
        category: true,
        tags: { include: { tag: true } },
      },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }

    return this.formatArticleResponse(article);
  }

  // ──────────────── Private helpers ────────────────

  private async incrementViewCount(slug: string) {
    try {
      await this.prisma.article.update({
        where: { slug },
        data: { viewCount: { increment: 1 } },
      });
    } catch {
      // Non-critical, log and continue
      this.logger.warn(`Failed to increment view count for slug: ${slug}`);
    }
  }

  private async invalidateCache(slug: string) {
    try {
      await this.cacheManager.del(`${CACHE_KEY_ARTICLE_PREFIX}${slug}`);
      await this.invalidateListCache();
    } catch {
      this.logger.warn(`Failed to invalidate cache for slug: ${slug}`);
    }
  }

  private async invalidateListCache() {
    try {
      // Delete all list caches by resetting the store
      // In production, use Redis SCAN + DEL for prefix-based invalidation
      const store = (this.cacheManager as any).stores?.[0] ?? (this.cacheManager as any).store;
      if (store?.keys) {
        const keys: string[] = await store.keys(`${CACHE_KEY_ARTICLES}:*`);
        for (const key of keys) {
          await this.cacheManager.del(key);
        }
      }
    } catch {
      this.logger.warn('Failed to invalidate list cache');
    }
  }

  private formatArticleResponse(article: any) {
    const formatted: any = {
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      featuredImage: article.featuredImage,
      status: article.status,
      viewCount: article.viewCount,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: article.author,
      category: article.category,
    };

    if (article.tags) {
      formatted.tags = article.tags.map((at: any) =>
        at.tag ? at.tag : at,
      );
    }

    return formatted;
  }

  // ──────────────── Delete ────────────────

  async remove(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }

    await this.prisma.articleTag.deleteMany({ where: { articleId: id } });
    await this.prisma.article.delete({ where: { id } });

    await this.invalidateCache(article.slug);
    await this.invalidateListCache();

    this.logger.log(`Article deleted: "${article.title}"`);

    return { message: 'Article deleted successfully' };
  }
}
