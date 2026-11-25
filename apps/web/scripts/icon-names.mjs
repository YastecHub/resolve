import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const source = readFileSync(new URL('../app/lib/icons.ts', import.meta.url), 'utf8');
const block = source.match(/export const ICONS = \{([\s\S]*?)\} as const;/);
if (!block) throw new Error('Could not find the ICONS map in app/lib/icons.ts');

export const iconEntries = [...block[1].matchAll(/'([a-z_.]+)':\s*'([a-z0-9-]+)'/g)].map((m) => ({
  key: m[1],
  name: m[2],
}));

export const prefix = source.match(/ICON_PREFIX = '([a-z0-9-]+)'/)?.[1] ?? 'hugeicons';
export const generatedPath = fileURLToPath(
  new URL('../app/lib/icons.generated.ts', import.meta.url),
);
