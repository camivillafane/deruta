import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get('API_CORS_ORIGIN', 'http://localhost:4200'),
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
