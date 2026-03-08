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
