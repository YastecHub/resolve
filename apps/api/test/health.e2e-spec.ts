import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { RedisService } from '../src/infra/redis.service.js';
import { configureApp } from '../src/setup.js';

describe('API envelope', () => {
  let app: INestApplication<App>;
  const database = { ping: vi.fn(), onModuleDestroy: vi.fn() };
  const redis = { ping: vi.fn(), onModuleDestroy: vi.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(database)
      .overrideProvider(RedisService)
      .useValue(redis)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('wraps a healthy report in the success envelope', async () => {
    database.ping.mockResolvedValue(undefined);
    redis.ping.mockResolvedValue(undefined);
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { status: 'ok', service: 'resolve-api' },
      meta: { requestId: expect.stringMatching(/^req_/) },
    });
    expect(res.headers['x-request-id']).toBe(res.body.meta.requestId);
  });

  it('returns 503 with the report in error.details when a dependency is down', async () => {
    database.ping.mockResolvedValue(undefined);
    redis.ping.mockRejectedValue(new Error('connection refused'));
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(503);
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'service_unavailable',
        details: { checks: { redis: { status: 'down', error: 'connection refused' } } },
      },
    });
  });

  it('echoes a valid incoming request ID', async () => {
    database.ping.mockResolvedValue(undefined);
    redis.ping.mockResolvedValue(undefined);
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-request-id', 'abc-123')
      .expect(200);
    expect(res.body.meta.requestId).toBe('abc-123');
  });

  it('rejects an invalid body with field errors', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/disputes')
      .send({ transactionId: 42, reasonCode: 'nope', extra: true })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('validation_error');
    const fields = res.body.error.fieldErrors.map((e: { field: string }) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['transactionId', 'reasonCode', 'extra']));
  });

  it('answers skeleton endpoints with not_implemented', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/disputes')
      .send({ transactionId: 'txn_ABC123', reasonCode: 'failed_transfer' })
      .expect(501);
    expect(res.body.error.code).toBe('not_implemented');
  });

  it('uses the failure envelope for unknown routes', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/nope').expect(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'not_found' } });
  });
});
