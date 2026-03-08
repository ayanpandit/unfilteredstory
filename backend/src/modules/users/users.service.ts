import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateUserDto, CreateUserDto } from './dto/index.js';
import type { PaginationDto, PaginatedResult } from '../../common/utils/pagination.util.js';
import type { User } from '@prisma/client';

type UserSafe = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ──────────────── Create user (Admin) ────────────────

  async create(dto: CreateUserDto) {
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('Email already in use');

    const existingUsername = await this.prisma.user.findUnique({ where: { username: dto.username.toLowerCase().trim() } });
    if (existingUsername) throw new ConflictException('Username already taken');

    const randomPassword = crypto.randomBytes(10).toString('base64url');
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        username: dto.username.toLowerCase().trim(),
        email: dto.email.toLowerCase().trim(),
        password: hashedPassword,
        role: dto.role,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    this.logger.log(`User created by admin: ${user.username}`);

    return { user, generatedPassword: randomPassword };
  }

  async findAll(query: PaginationDto): Promise<PaginatedResult<UserSafe>> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { articles: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users as unknown as UserSafe[],
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

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { articles: true } },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto, currentUserId?: string) {
    await this.findOne(id);

    // Prevent admin from changing their own role
    if (currentUserId && id === currentUserId && dto.role) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`User updated: ${user.username}`);

    return user;
  }

  // ──────────────── Self-update (any logged-in user) ────────────────

  async updateSelf(userId: string, dto: { name?: string; email?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email.toLowerCase().trim() !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
      if (existing) throw new ConflictException('Email already in use');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.email && { email: dto.email.toLowerCase().trim() }),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  // ──────────────── Change own password ────────────────

  async changePassword(userId: string, dto: { currentPassword: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new ForbiddenException('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    this.logger.log(`User ${userId} changed their password`);

    return { message: 'Password changed successfully' };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.user.delete({ where: { id } });

    this.logger.log(`User deleted: ${id}`);

    return { message: 'User deleted successfully' };
  }
}
