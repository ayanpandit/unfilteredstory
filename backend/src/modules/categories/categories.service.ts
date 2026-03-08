import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/index.js';
import { generateSlug } from '../../common/utils/slug.util.js';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const slug = generateSlug(dto.name);

    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new ConflictException(`Category with slug "${slug}" already exists`);
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
      },
      include: {
        _count: { select: { articles: true } },
      },
    });

    this.logger.log(`Category created: ${category.name}`);

    return category;
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        _count: { select: { articles: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { articles: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    const data: any = { ...dto };

    if (dto.name) {
      data.slug = generateSlug(dto.name);

      const existingCategory = await this.prisma.category.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });

      if (existingCategory) {
        throw new ConflictException(
          `Category with slug "${data.slug}" already exists`,
        );
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data,
      include: {
        _count: { select: { articles: true } },
      },
    });

    this.logger.log(`Category updated: ${category.name}`);

    return category;
  }

  async remove(id: string) {
    const category = await this.findOne(id);

    const articleCount = await this.prisma.article.count({
      where: { categoryId: id },
    });

    if (articleCount > 0) {
      throw new ConflictException(
        `Cannot delete category "${category.name}" because it has ${articleCount} article(s)`,
      );
    }

    await this.prisma.category.delete({ where: { id } });

    this.logger.log(`Category deleted: ${category.name}`);

    return { message: 'Category deleted successfully' };
  }
}
