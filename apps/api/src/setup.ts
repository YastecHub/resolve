import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor.js';
import { requestId } from './common/request-id.js';
import { createValidationPipe } from './common/validation.js';
import { ErrorResponseDto } from './common/dto/response.dto.js';

export const API_PREFIX = 'api/v1';

export function configureApp(app: INestApplication) {
  app.use(requestId);
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
}

export function buildOpenApi(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('resolve API')
    .setDescription(
      [
        'Dispute investigation for banks: file disputes, follow the agent, act on its recommendations.',
        '',
        '**Envelope.** Every response is wrapped.',
        '',
        '- Success: `{ "success": true, "data": …, "meta": { "requestId", "timestamp" } }`. Paged lists add `page`, `pageSize` and `total` to `meta`.',
        '- Failure: `{ "success": false, "error": { "code", "message", "fieldErrors"?, "details"? }, "meta": { "requestId", "timestamp" } }`.',
        '',
        '**Money** is integer kobo (`amountMinor`). **Request IDs**: send `x-request-id` to correlate, or one is generated and returned in the same header.',
      ].join('\n'),
    )
    .setVersion(process.env.APP_VERSION ?? 'dev')
    .addServer('/')
    .build();
  return SwaggerModule.createDocument(app, config, {
    extraModels: [ErrorResponseDto],
    operationIdFactory: (_controller, method) => method,
  });
}
