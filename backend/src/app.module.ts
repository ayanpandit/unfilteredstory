import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { APP_GUARD } from '@nestjs/core';

import {
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  validate,
} from './config/index.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { ArticlesModule } from './modules/articles/articles.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { TagsModule } from './modules/tags/tags.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { RssModule } from './modules/rss/rss.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { JwtAuthGuard } from './common/guards/index.js';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig],
      validate,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Redis-backed Cache
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('redis.host', 'localhost');
        const redisPort = configService.get<number>('redis.port', 6379);

        try {
          const { redisStore } = await import('cache-manager-ioredis-yet');
          return {
            store: redisStore,
            host: redisHost,
            port: redisPort,
            ttl: 60000,
          };
        } catch {
          // Fallback to in-memory cache if Redis is unavailable
          return { ttl: 60000 };
        }
      },
    }),

    // Health Checks
    TerminusModule,

    // Database
    PrismaModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    ArticlesModule,
    CategoriesModule,
    TagsModule,
    AdminModule,
    RssModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
