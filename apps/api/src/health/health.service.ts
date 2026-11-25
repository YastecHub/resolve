import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../infra/database.service.js';
import { RedisService } from '../infra/redis.service.js';
import { overallStatus, runCheck, type HealthReport } from './health.status.js';

const CHECK_TIMEOUT_MS = 2_500;

@Injectable()
export class HealthService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async report(): Promise<HealthReport> {
    const [database, redis] = await Promise.all([
      runCheck(() => this.database.ping(), CHECK_TIMEOUT_MS),
      runCheck(() => this.redis.ping(), CHECK_TIMEOUT_MS),
    ]);
    const checks = { api: { status: 'up' as const, latencyMs: 0 }, database, redis };
    return {
      status: overallStatus(checks),
      service: 'resolve-api',
      version: process.env.APP_VERSION ?? 'dev',
      uptimeSeconds: Math.round(process.uptime()),
      time: new Date().toISOString(),
      checks,
    };
  }
}
