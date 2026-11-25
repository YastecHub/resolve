import { randomBytes } from 'node:crypto';
import { Logger } from '@nestjs/common';

export const TOKEN_TTL_SECONDS = 12 * 60 * 60;

let devSecret: string | undefined;

/** AUTH_SECRET is required in production; elsewhere a per-process secret keeps local runs simple. */
export function authSecret(env: NodeJS.ProcessEnv = process.env): string {
  if (env.AUTH_SECRET) return env.AUTH_SECRET;
  if (env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be set in production.');
  }
  if (!devSecret) {
    devSecret = randomBytes(32).toString('hex');
    new Logger('Auth').warn('AUTH_SECRET is not set; using a random secret for this process.');
  }
  return devSecret;
}
