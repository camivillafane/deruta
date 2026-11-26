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

  // La API corre detrás de proxies (nginx compartido / Caddy) en redes privadas de Docker.
  // Confiar en ellos hace que req.ip sea la IP real del cliente (la usa el rate limit).
  app.set('trust proxy', 'loopback, linklocal, uniquelocal');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  app.enableCors({
    // El deploy casero define API_CORS_ORIGIN; .env.example usa CORS_ORIGIN.
    origin: configService.get('CORS_ORIGIN') ?? configService.get('API_CORS_ORIGIN', 'http://localhost:4200'),
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
