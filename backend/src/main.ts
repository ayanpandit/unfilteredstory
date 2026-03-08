import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/index.js';
import { LoggingInterceptor, TransformInterceptor } from './common/interceptors/index.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // ─── Security ───
  app.use(helmet());

  // ─── CORS ───
  const corsOrigin = configService.get<string>('app.corsOrigin', '*');
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ─── Global Prefix ───
  app.setGlobalPrefix('api/v1');

  // ─── Global Validation Pipe ───
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Global Exception Filter ───
  app.useGlobalFilters(new AllExceptionsFilter());

  // ─── Global Interceptors ───
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // ─── Swagger Documentation ───
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Unfilter Story CMS API')
      .setDescription('Enterprise-grade News CMS Backend API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('Health', 'Health check endpoints')
      .addTag('Auth', 'Authentication & authorization')
      .addTag('Users', 'User management')
      .addTag('Articles', 'Article CRUD & publishing workflow')
      .addTag('Categories', 'Category management')
      .addTag('Tags', 'Tag management')
      .addTag('Admin', 'Admin dashboard')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log('Swagger documentation available at /api/docs');
  }

  // ─── Graceful Shutdown ───
  app.enableShutdownHooks();

  // ─── Start ───
  const port = configService.get<number>('app.port', 3000);
  await app.listen(port, '0.0.0.0');

  logger.log(`Application running on port ${port}`);
  logger.log(`Environment: ${configService.get<string>('app.nodeEnv', 'development')}`);
}

bootstrap();
