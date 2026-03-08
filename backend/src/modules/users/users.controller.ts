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
import { UsersService } from './users.service.js';
import { UpdateUserDto, CreateUserDto } from './dto/index.js';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/index.js';
import { Roles, CurrentUser } from '../../common/decorators/index.js';
import { PaginationDto } from '../../common/utils/index.js';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async findAll(@Query() query: PaginationDto) {
    return this.usersService.findAll(query);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new user with random password (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created with generated password' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get own profile' })
  async getMe(@CurrentUser('userId') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own basic details (name, email)' })
  async updateMe(
    @CurrentUser('userId') userId: string,
    @Body() dto: { name?: string; email?: string },
  ) {
    return this.usersService.updateSelf(userId, dto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change own password' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 403, description: 'Current password incorrect' })
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(userId, dto);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('userId') currentUserId: string,
  ) {
    return this.usersService.update(id, dto, currentUserId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
