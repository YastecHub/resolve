import { randomBytes } from 'node:crypto';

export const ID_PREFIXES = {
  customer: 'cus',
  merchant: 'mer',
  device: 'dev',
  transaction: 'txn',
  ledgerEntry: 'led',
  settlement: 'stl',
  dispute: 'dsp',
  investigation: 'inv',
  step: 'stp',
  analystAction: 'act',
  demoCase: 'dmo',
  staff: 'usr',
  accessEvent: 'acc',
} as const;
export type IdPrefix = (typeof ID_PREFIXES)[keyof typeof ID_PREFIXES];

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeTime(ms: number): string {
  let out = '';
  let value = ms;
  for (let i = 0; i < 10; i++) {
    out = CROCKFORD[value % 32] + out;
    value = Math.floor(value / 32);
  }
  return out;
}

function encodeRandom(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) out += CROCKFORD[byte % 32];
  return out;
}

/** A ULID: 10 time characters then 16 random ones, so IDs sort by creation time. */
export function ulid(now = Date.now(), random: Uint8Array = randomBytes(16)): string {
  return encodeTime(now) + encodeRandom(random.subarray(0, 16));
}

export function newId(prefix: IdPrefix, now?: number): string {
  return `${prefix}_${ulid(now)}`;
}
