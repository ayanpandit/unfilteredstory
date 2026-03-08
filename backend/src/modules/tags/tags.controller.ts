import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
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
import { TagsService } from './tags.service.js';
import { CreateTagDto } from './dto/index.js';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/index.js';
import { Roles, Public } from '../../common/decorators/index.js';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({ status: 201, description: 'Tag created' })
  @ApiResponse({ status: 409, description: 'Tag already exists' })
  async create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({ status: 200, description: 'List of tags' })
  async findAll() {
    return this.tagsService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get tag by ID' })
  @ApiResponse({ status: 200, description: 'Tag details' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a tag (Admin only)' })
  @ApiResponse({ status: 200, description: 'Tag deleted' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.remove(id);
  }
}
