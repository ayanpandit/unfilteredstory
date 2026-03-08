import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/index.js';
import { Roles } from '../../common/decorators/index.js';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getDashboard() {
    return this.adminService.getDashboard();
  }
}
