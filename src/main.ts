import 'dotenv/config';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { env } from 'process';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({
    origin: env.CORS_ORIGIN,
    methods: ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'],
  });
  app.use(helmet());
  await app.listen(env.PORT ?? 3000);
}
bootstrap();
