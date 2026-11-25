import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:4200'),
    credentials: true,
  });

  app.setGlobalPrefix(configService.get('API_PREFIX', 'api/v1'));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  const port = configService.get('API_PORT', 3000);
  await app.listen(port);
  console.log(`API running on http://localhost:${port}/${configService.get('API_PREFIX', 'api/v1')}`);
}
await bootstrap();
