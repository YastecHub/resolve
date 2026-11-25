import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { generatedPath, iconEntries, prefix } from './icon-names.mjs';

const require = createRequire(import.meta.url);
const set = require('@iconify-json/hugeicons/icons.json');
const names = [...new Set(iconEntries.map((entry) => entry.name))].sort();

const icons = {};
const missing = [];
for (const name of names) {
  const target = set.icons[name] ? name : set.aliases?.[name]?.parent;
  const data = target ? set.icons[target] : undefined;
  if (data) icons[name] = data;
  else missing.push(name);
}

if (missing.length > 0) {
  console.error(`Not found in @iconify-json/hugeicons: ${missing.join(', ')}`);
  process.exit(1);
}

const bundle = { prefix, width: set.width ?? 24, height: set.height ?? 24, icons };
const output = `import type { IconifyJSON } from '@iconify/react/offline';\n\nexport const iconBundle: IconifyJSON = ${JSON.stringify(bundle, null, 2)};\n`;
writeFileSync(generatedPath, output);
console.log(`Wrote ${names.length} icons to app/lib/icons.generated.ts`);
