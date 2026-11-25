import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { API_PREFIX, buildOpenApi, configureApp } from './setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  SwaggerModule.setup(`${API_PREFIX}/docs`, app, buildOpenApi(app), {
    jsonDocumentUrl: `${API_PREFIX}/openapi.json`,
    customSiteTitle: 'resolve API',
  });
  await app.listen(Number(process.env.PORT ?? 9000), '0.0.0.0');
}
await bootstrap();
