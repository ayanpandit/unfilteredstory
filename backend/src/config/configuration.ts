import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiration: process.env.JWT_EXPIRATION || '1d',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
}));

export const masterAdminConfig = registerAs('masterAdmin', () => ({
  username: process.env.MASTER_ADMIN_USERNAME || 'masteradmin',
  password: process.env.MASTER_ADMIN_PASSWORD || '',
  email: process.env.MASTER_ADMIN_EMAIL || 'master@unfilterstory.com',
  name: process.env.MASTER_ADMIN_NAME || 'Master Admin',
}));

export const feedConfig = registerAs('feed', () => ({
  siteUrl: (process.env.SITE_URL || process.env.CORS_ORIGIN || 'http://localhost:3002').split(',')[0].trim(),
  feedBaseUrl: process.env.FEED_BASE_URL || '',
  title: process.env.SITE_TITLE || 'UnfilterStory',
  subtitle: process.env.SITE_SUBTITLE || 'Raw Startup Intelligence — No fluff. No bias. Just the stories that matter.',
  copyright: `© ${new Date().getFullYear()} UnfilterStory. All rights reserved.`,
  language: process.env.SITE_LANGUAGE || 'en',
  authorName: process.env.SITE_AUTHOR || 'UnfilterStory Editorial',
  authorEmail: process.env.SITE_AUTHOR_EMAIL || 'editorial@unfilterstory.com',
  ttl: parseInt(process.env.FEED_TTL ?? '60', 10),
  maxItems: parseInt(process.env.FEED_MAX_ITEMS ?? '50', 10),
}));
