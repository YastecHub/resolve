import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(import.meta.dirname, '..');
const ALLOWED = new Set(['demo/demo.service.ts']);

const FORBIDDEN = [
  /\b(agentStep|analystAction|accessEvent)\.(update|updateMany|upsert|delete|deleteMany)\b/,
  /\bUPDATE\s+"?(agent_steps|analyst_actions|access_events)\b/i,
  /\bDELETE\s+FROM\s+"?(agent_steps|analyst_actions|access_events)\b/i,
  /\bTRUNCATE\b[^;'"`]*\b(agent_steps|analyst_actions|access_events)\b/i,
];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === 'generated') return [];
    if (statSync(path).isDirectory()) return files(path);
    return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : [];
  });
}

describe('audit tables are append-only', () => {
  it('has no app code that updates or deletes audit rows (outside the demo reset)', () => {
    const offenders = files(SRC)
      .filter((path) => !ALLOWED.has(relative(SRC, path).replace(/\\/g, '/')))
      .flatMap((path) =>
        readFileSync(path, 'utf8')
          .split('\n')
          .flatMap((line, i) =>
            FORBIDDEN.some((re) => re.test(line))
              ? [`${relative(SRC, path)}:${i + 1}: ${line.trim()}`]
              : [],
          ),
      );
    expect(offenders).toEqual([]);
  });

  it('catches an offending line', () => {
    expect(FORBIDDEN.some((re) => re.test('await tx.agentStep.update({ where })'))).toBe(true);
    expect(FORBIDDEN.some((re) => re.test('DELETE FROM agent_steps WHERE 1=1'))).toBe(true);
  });
});
