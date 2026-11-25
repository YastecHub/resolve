import { formatNaira } from '@resolve/shared';
import { formatAbsolute } from '~/lib/format';

const MAX_ROWS = 12;
const MAX_VALUE_CHARS = 80;

type Scalar = string | number | boolean | null;

function isScalar(value: unknown): value is Scalar {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function stripUntrusted(text: string): string {
  return text.replace(/<\/?untrusted>/gi, '');
}

function label(path: string[]): string {
  const text = path.join(' ').replace(/_/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function format(key: string, value: Scalar): string {
  if (value === null) return 'None';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    if (key.endsWith('_minor')) return formatNaira(value);
    if (key.endsWith('_at') && value > 1_000_000_000_000) return formatAbsolute(value);
    return String(value);
  }
  const clean = stripUntrusted(value);
  return clean.length > MAX_VALUE_CHARS ? `${clean.slice(0, MAX_VALUE_CHARS)}…` : clean;
}

function collect(value: unknown, path: string[], rows: [string, string][], depth: number): void {
  if (rows.length >= MAX_ROWS) return;
  if (isScalar(value)) {
    const key = path[path.length - 1] ?? '';
    rows.push([label(path), format(key, value)]);
    return;
  }
  if (Array.isArray(value)) {
    if (path.length > 0)
      rows.push([label(path), `${value.length} ${value.length === 1 ? 'item' : 'items'}`]);
    return;
  }
  if (value && typeof value === 'object' && depth < 2) {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (hidden(key)) continue;
      collect(child, [...path, key], rows, depth + 1);
    }
  }
}

const HIDDEN_KEYS = new Set(['truncated', 'summary']);

function hidden(key: string): boolean {
  return HIDDEN_KEYS.has(key) || key.endsWith('_id') || key.endsWith('_iso');
}

export function stepDetails(output: unknown, ok: boolean): Record<string, string> | undefined {
  if (!ok || !output || typeof output !== 'object') return undefined;
  const record = output as { data?: unknown };
  const data = record.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;

  const rows: [string, string][] = [];
  for (const [key, child] of Object.entries(data as Record<string, unknown>)) {
    if (hidden(key)) continue;
    collect(child, [key], rows, 0);
  }
  return rows.length > 0 ? Object.fromEntries(rows) : undefined;
}
