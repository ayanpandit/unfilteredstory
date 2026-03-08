import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class MasterAdminService implements OnModuleInit {
  private readonly logger = new Logger(MasterAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureMasterAdmin();
  }

  private async ensureMasterAdmin() {
    const username = this.configService.get<string>('masterAdmin.username', 'masteradmin');
    const password = this.configService.get<string>('masterAdmin.password', '');
    const email = this.configService.get<string>('masterAdmin.email', 'master@unfilterstory.com');
    const name = this.configService.get<string>('masterAdmin.name', 'Master Admin');

    if (!password) {
      this.logger.warn('MASTER_ADMIN_PASSWORD not set — skipping master admin bootstrap');
      return;
    }

    const existing = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      // Ensure existing master admin stays ADMIN and active
      if (existing.role !== 'ADMIN' || !existing.isActive) {
        await this.prisma.user.update({
          where: { id: existing.id },
          data: { role: 'ADMIN', isActive: true },
        });
        this.logger.log(`Master admin "${username}" restored to ADMIN role`);
      }

      // Update password to match env (in case it was changed)
      const passwordMatch = await bcrypt.compare(password, existing.password);
      if (!passwordMatch) {
        const hashed = await bcrypt.hash(password, 12);
        await this.prisma.user.update({
          where: { id: existing.id },
          data: { password: hashed },
        });
        this.logger.log(`Master admin "${username}" password synced from env`);
      }

      this.logger.log(`Master admin "${username}" verified`);
      return;
    }

    // Create the master admin
    const hashed = await bcrypt.hash(password, 12);
    await this.prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashed,
        role: 'ADMIN',
        isActive: true,
      },
    });

    this.logger.log(`Master admin "${username}" created successfully`);
  }
}
