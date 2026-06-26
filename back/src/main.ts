import { config as loadEnv } from 'dotenv';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { ensureRedisAvailability } from './redis/redis.bootstrap';
import { createRedisClient, isRedisClient } from './redis/redis.factory';

async function bootstrap() {
  loadEnv({ path: ['.env.local', '.env'] });
  await ensureRedisAvailability();

  const { AppModule } = await import('./app.module.js');
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') ?? 3000;
  const apiPrefix = config.get<string>('app.apiPrefix') ?? 'api';
  const corsOrigins = config.get<string[]>('app.corsOrigins') ?? [
    'http://localhost:5173',
  ];
  const isDev = config.get<string>('app.env') !== 'production';
  const lanOriginPattern =
    /^https?:\/\/(localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/;
  const redisEnabled = config.get<boolean>('redis.enabled');
  const bodyLimit = config.get<string>('app.bodyLimit') ?? '5mb';

  app.set('trust proxy', 1);
  app.setGlobalPrefix(apiPrefix);

  app.useBodyParser('json', { limit: bodyLimit });
  app.useBodyParser('urlencoded', { limit: bodyLimit, extended: true });

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  const sessionOptions: session.SessionOptions = {
    secret: config.getOrThrow<string>('session.secret'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.get<string>('app.env') === 'production',
      maxAge: config.get<number>('session.maxAge'),
      sameSite: 'lax',
    },
  };

  if (redisEnabled) {
    const sessionRedis = await createRedisClient(config);
    if (isRedisClient(sessionRedis)) {
      sessionOptions.store = new RedisStore({ client: sessionRedis });
    }
  }

  app.use(session(sessionOptions));

  app.enableCors({
    origin: isDev
      ? (origin, callback) => {
          if (
            !origin ||
            corsOrigins.includes(origin) ||
            lanOriginPattern.test(origin)
          ) {
            callback(null, true);
            return;
          }
          callback(null, false);
        }
      : corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (config.get<boolean>('swagger.enabled')) {
    const swaggerPath = config.get<string>('swagger.path') ?? 'docs';
    const swaggerConfig = new DocumentBuilder()
      .setTitle(config.get<string>('app.name') ?? 'Warehouse API')
      .setDescription('Ombor boshqaruv tizimi REST API hujjatlari')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Autentifikatsiya va avtorizatsiya')
      .addTag('Health', 'Tizim holati')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    logger.log(`Swagger: http://localhost:${port}/${swaggerPath}`);
  }

  await app.listen(port, '0.0.0.0');

  logger.log(`API: http://localhost:${port}/${apiPrefix}`);
  logger.log(`WebSocket: http://localhost:${port}`);
  logger.log(`LAN: boshqa qurilmalar http://<sizning-IP>:${port}/${apiPrefix} orqali ulanishi mumkin`);
  logger.log(`Environment: ${config.get<string>('app.env')}`);
  logger.log(`Redis: ${redisEnabled ? 'enabled' : 'disabled (in-memory mode)'}`);
}

void bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
