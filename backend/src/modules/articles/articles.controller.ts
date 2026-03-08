import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ArticlesService } from './articles.service.js';
import {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleQueryDto,
} from './dto/index.js';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/index.js';
import { Roles, CurrentUser, Public } from '../../common/decorators/index.js';

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  // ─── Public endpoints ───

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get published articles (public, paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Paginated list of published articles' })
  async findPublic(@Query() query: ArticleQueryDto) {
    return this.articlesService.findPublic(query);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get article by slug (public, increments view count)' })
  @ApiResponse({ status: 200, description: 'Article details' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.articlesService.findBySlug(slug);
  }

  // ─── Authenticated endpoints ───

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR, Role.REPORTER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new article (authenticated users)' })
  @ApiResponse({ status: 201, description: 'Article created with DRAFT status' })
  async create(
    @Body() dto: CreateArticleDto,
    @CurrentUser() user: any,
  ) {
    return this.articlesService.create(dto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR, Role.REPORTER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update article (author/editor/admin)' })
  @ApiResponse({ status: 200, description: 'Article updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() user: any,
  ) {
    return this.articlesService.update(id, dto, user);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish article (Editor or Admin only)' })
  @ApiResponse({ status: 200, description: 'Article published' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.articlesService.publish(id, user);
  }

  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive article (Admin only)' })
  @ApiResponse({ status: 200, description: 'Article archived' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.articlesService.archive(id, user);
  }

  @Patch(':id/unarchive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unarchive article back to DRAFT (Admin or Editor)' })
  @ApiResponse({ status: 200, description: 'Article unarchived to DRAFT' })
  @ApiResponse({ status: 400, description: 'Article is not archived' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async unarchive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.articlesService.unarchive(id, user);
  }

  // ─── CMS management endpoint (authenticated) ───

  @Get('manage/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR, Role.REPORTER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all articles for CMS management (role-scoped)' })
  @ApiResponse({ status: 200, description: 'Paginated list of articles' })
  async findAll(
    @Query() query: ArticleQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.articlesService.findAll(query, user);
  }

  @Get('manage/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR, Role.REPORTER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get article by ID for editing' })
  @ApiResponse({ status: 200, description: 'Article details' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async findOneById(@Param('id', ParseUUIDPipe) id: string) {
    return this.articlesService.findOneById(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete article (Admin only)' })
  @ApiResponse({ status: 200, description: 'Article deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.articlesService.remove(id);
  }
}
