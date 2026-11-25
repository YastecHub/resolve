import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { AppException } from '../common/errors/app.exception.js';
import { loadProfiles } from '../ai/profiles.js';
import { PrismaService } from '../infra/prisma.service.js';
import { RedisService } from '../infra/redis.service.js';
import {
  flattenSettings,
  mergeSettings,
  settingsDefaults,
  type AppSettings,
} from './settings.defaults.js';
import type { UpdateSettingsDto } from './dto/settings.dto.js';

const CACHE_KEY = 'config:v1';
const CACHE_TTL_SECONDS = 60;

@Injectable()
export class SettingsService {
  private readonly logger = new Logger('SettingsService');

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async get(): Promise<AppSettings> {
    const cached = await this.cacheRead();
    if (cached) return cached;
    const rows = await this.prisma.config.findMany();
    const merged = mergeSettings(settingsDefaults(), rows);
    await this.cacheWrite(merged);
    return merged;
  }

  async update(patch: UpdateSettingsDto, actorEmail: string): Promise<AppSettings> {
    const current = await this.get();
    const autoTypes = patch.policy?.autoTypes ?? current.policy.autoTypes;
    const reviewTypes = patch.policy?.reviewTypes ?? current.policy.reviewTypes;
    const both = autoTypes.filter((type) => reviewTypes.includes(type));
    if (both.length) {
      throw invalid(
        'policy.autoTypes',
        `A type can't be both auto-eligible and review-only: ${both.join(', ')}.`,
      );
    }
    const profile = patch.ai?.activeProfile;
    if (profile !== undefined && !loadProfiles().some((p) => p.name === profile)) {
      throw invalid('ai.activeProfile', `No AI profile is named "${profile}".`);
    }

    const rows = flattenSettings({
      policy: patch.policy,
      agent: patch.agent,
      ai: patch.ai,
    } as never);
    await this.prisma.$transaction(
      rows.map(({ key, value }) =>
        this.prisma.config.upsert({
          where: { key },
          create: { key, value: value as never, updatedBy: actorEmail },
          update: { value: value as never, updatedBy: actorEmail },
        }),
      ),
    );
    await this.cacheClear();
    return this.get();
  }

  private async cacheRead(): Promise<AppSettings | null> {
    try {
      await this.redis.ensureConnected();
      const raw = await this.redis.client.get(CACHE_KEY);
      return raw ? (JSON.parse(raw) as AppSettings) : null;
    } catch {
      return null;
    }
  }

  private async cacheWrite(value: AppSettings) {
    try {
      await this.redis.client.set(CACHE_KEY, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS);
    } catch (error) {
      this.logger.warn(`Config cache write failed: ${(error as Error).message}`);
    }
  }

  private async cacheClear() {
    try {
      await this.redis.ensureConnected();
      await this.redis.client.del(CACHE_KEY);
    } catch (error) {
      this.logger.warn(`Config cache clear failed: ${(error as Error).message}`);
    }
  }
}

function invalid(field: string, message: string) {
  return new AppException(HttpStatus.BAD_REQUEST, {
    code: 'validation_error',
    message: 'The request is invalid.',
    fieldErrors: [{ field, message }],
  });
}
