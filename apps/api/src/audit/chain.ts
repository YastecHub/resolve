import { createHash } from 'node:crypto';

export const GENESIS_HASH = '0'.repeat(64);
export const MAX_STORED_BYTES = 4096;

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => sortKeys(item) ?? null);
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const next = sortKeys((value as Record<string, unknown>)[key]);
      if (next !== undefined) sorted[key] = next;
    }
    return sorted;
  }
  return value;
}

/** JSON with sorted keys, so the hash doesn't depend on key order after a database round trip. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value)) ?? 'null';
}

export interface HashableStep {
  prevHash: string;
  seq: number;
  kind: string;
  toolName: string | null;
  input: unknown;
  output: unknown;
}

export function computeStepHash(step: HashableStep): string {
  return createHash('sha256')
    .update(
      [
        step.prevHash,
        step.seq,
        step.kind,
        step.toolName ?? '',
        canonicalJson(step.input),
        canonicalJson(step.output),
      ].join('|'),
    )
    .digest('hex');
}

export interface ChainStep extends HashableStep {
  hash: string;
}

export interface ChainVerification {
  valid: boolean;
  checked: number;
  brokenAtSeq?: number;
}

/** Steps must be ordered by `seq`. */
export function verifyChain(steps: ChainStep[]): ChainVerification {
  let prevHash = GENESIS_HASH;
  let checked = 0;
  for (const [index, step] of steps.entries()) {
    checked++;
    const expected = computeStepHash({ ...step, prevHash });
    if (step.seq !== index + 1 || step.prevHash !== prevHash || step.hash !== expected) {
      return { valid: false, checked, brokenAtSeq: step.seq };
    }
    prevHash = step.hash;
  }
  return { valid: true, checked };
}

/** Caps what we store per step; the stored value is what gets hashed. */
export function limitForStorage(value: unknown, maxBytes = MAX_STORED_BYTES): unknown {
  const json = canonicalJson(value);
  const bytes = Buffer.byteLength(json);
  if (bytes <= maxBytes) return JSON.parse(json);
  const ok =
    typeof value === 'object' && value !== null && 'ok' in value
      ? Boolean((value as { ok: unknown }).ok)
      : null;
  return { ok, truncated: true, original_bytes: bytes, preview: json.slice(0, 1024) };
}
