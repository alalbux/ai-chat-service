import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../app.module';
import { JsonLogger } from '../observability/json-logger.service';
import { RequestContextMiddleware } from '../observability/request-context.middleware';

function corsOriginOption(): boolean | string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) {
    return true;
  }
  const list = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return list.length > 0 ? list : true;
}

export async function bootstrapWebProcess() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(JsonLogger));
  app.use(new RequestContextMiddleware().use);
  app.enableShutdownHooks();
  app.enableCors({
    origin: corsOriginOption(),
    credentials: true,
  });
  const globalPrefix = process.env.API_GLOBAL_PREFIX?.trim();
  if (globalPrefix) {
    app.setGlobalPrefix(globalPrefix);
  }
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('AI Chat API')
    .setDescription('Chat microservice — OpenRouter with Gemini failover')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  const base = `http://localhost:${port}`;
  const docsPath = globalPrefix ? `/${globalPrefix}/docs` : '/docs';
  Logger.log(`Listening on ${base}`, 'Bootstrap');
  Logger.log(`Swagger UI: ${base}${docsPath}`, 'Bootstrap');
}
