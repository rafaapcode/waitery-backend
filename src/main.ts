import './instrument';

import 'dotenv/config';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { env } from './shared/config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (env.NODE_ENV === 'PROD') {
    app.use(helmet());
    app.enableCors({
      origin: 'http://localhost:3000',
      methods: ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'],
    });
  }

  await app.listen(env.PORT ?? 3000);
}
bootstrap();
