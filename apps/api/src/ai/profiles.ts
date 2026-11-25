import { z } from 'zod';
import type { AiProfile } from './types.js';

const profileSchema = z.object({
  name: z.string().regex(/^[a-z0-9_-]+$/i),
  label: z.string().min(1),
  kind: z.string().min(1),
  baseUrl: z.string().url(),
  model: z.string().min(1),
  timeoutMs: z.number().int().positive().optional(),
});

/** Reads `AI_PROFILES` (a JSON array). Invalid entries are dropped rather than crashing boot. */
export function loadProfiles(env: NodeJS.ProcessEnv = process.env): AiProfile[] {
  const raw = env.AI_PROFILES;
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item) => {
    const result = profileSchema.safeParse(item);
    return result.success ? [result.data] : [];
  });
}

/** `AI_KEY_<NAME>`, upper-cased with dashes as underscores. */
export function profileKey(name: string, env: NodeJS.ProcessEnv = process.env): string | undefined {
  return env[`AI_KEY_${name.toUpperCase().replace(/-/g, '_')}`] || undefined;
}

export function endpointHost(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    return url.host;
  } catch {
    return '';
  }
}
