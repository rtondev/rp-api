import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

function parseCorsOrigins(): string[] {
  const fallback = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return fallback;

  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : fallback;
}

function isCorsOriginAllowed(
  origin: string | undefined,
  allowedOrigins: string[],
): boolean {
  if (!origin) return true;

  if (allowedOrigins.includes(origin)) return true;

  return allowedOrigins.some((allowed) => {
    if (!allowed.startsWith('*.')) return false;
    const suffix = allowed.slice(1);
    return origin.endsWith(suffix) || origin === allowed.slice(2);
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigins = parseCorsOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      if (isCorsOriginAllowed(origin, corsOrigins)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
