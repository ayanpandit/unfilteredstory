import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTagDto } from './dto/index.js';
import { generateSlug } from '../../common/utils/slug.util.js';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTagDto) {
    const slug = generateSlug(dto.name);

    const existingTag = await this.prisma.tag.findUnique({
      where: { slug },
    });

    if (existingTag) {
      throw new ConflictException(`Tag with slug "${slug}" already exists`);
    }

    const tag = await this.prisma.tag.create({
      data: {
        name: dto.name,
        slug,
      },
    });

    this.logger.log(`Tag created: ${tag.name}`);

    return tag;
  }

  async findAll() {
    return this.prisma.tag.findMany({
      include: {
        _count: { select: { articles: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        _count: { select: { articles: true } },
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }

    return tag;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.tag.delete({ where: { id } });

    this.logger.log(`Tag deleted: ${id}`);

    return { message: 'Tag deleted successfully' };
  }
}
