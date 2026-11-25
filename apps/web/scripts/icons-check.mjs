import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { generatedPath, iconEntries, prefix } from './icon-names.mjs';

const require = createRequire(import.meta.url);
const names = [...new Set(iconEntries.map((entry) => entry.name))];
const problems = [];

const response = await fetch(
  `https://api.iconify.design/${prefix}.json?icons=${names.join(',')}`,
).catch((error) => {
  problems.push(`Iconify API unreachable: ${error.message}`);
  return null;
});

if (response) {
  if (!response.ok) {
    problems.push(`Iconify API returned ${response.status}`);
  } else {
    const data = await response.json();
    for (const name of data.not_found ?? []) problems.push(`Missing on Iconify API: ${name}`);
    for (const name of names) {
      if (!data.icons?.[name] && !(data.not_found ?? []).includes(name) && !data.aliases?.[name]) {
        problems.push(`Not returned by Iconify API: ${name}`);
      }
    }
  }
}

const local = require('@iconify-json/hugeicons/icons.json');
for (const name of names) {
  if (!local.icons[name] && !local.aliases?.[name]) problems.push(`Missing in local set: ${name}`);
}

try {
  const generated = readFileSync(generatedPath, 'utf8');
  for (const name of names) {
    if (!new RegExp(`[\\s{,]["']?${name}["']?\\s*:`).test(generated)) {
      problems.push(`Missing in offline bundle (run icons:build): ${name}`);
    }
  }
} catch {
  problems.push('Offline bundle not found (run icons:build)');
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`All ${names.length} icons resolve (API, local set, offline bundle).`);
