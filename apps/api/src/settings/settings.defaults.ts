import type { ClassifiedType, ExecutionMode } from '../common/domain.js';

export interface AppSettings {
  policy: {
    confidenceThreshold: number;
    valueCapMinor: number;
    autoTypes: ClassifiedType[];
    reviewTypes: ClassifiedType[];
    minEvidenceForAuto: number;
    executionMode: ExecutionMode;
  };
  agent: { maxSteps: number; duplicateWindowMinutes: number };
  ai: { activeProfile: string };
}

export function settingsDefaults(env: NodeJS.ProcessEnv = process.env): AppSettings {
  return {
    policy: {
      confidenceThreshold: 0.9,
      valueCapMinor: 5_000_000,
      autoTypes: ['failed_transfer_debit', 'duplicate_charge'],
      reviewTypes: ['unauthorised_payment', 'merchant_non_delivery'],
      minEvidenceForAuto: 2,
      executionMode: 'execute',
    },
    agent: { maxSteps: 8, duplicateWindowMinutes: 10 },
    ai: { activeProfile: env.AI_ACTIVE_PROFILE ?? 'hosted' },
  };
}

/** Flattens to `policy.confidenceThreshold`-style keys, one config row each. */
export function flattenSettings(partial: Record<string, Record<string, unknown> | undefined>) {
  const rows: { key: string; value: unknown }[] = [];
  for (const [group, values] of Object.entries(partial)) {
    for (const [leaf, value] of Object.entries(values ?? {})) {
      if (value !== undefined) rows.push({ key: `${group}.${leaf}`, value });
    }
  }
  return rows;
}

/** Overlays stored rows on the defaults. Unknown keys are ignored. */
export function mergeSettings(
  defaults: AppSettings,
  rows: { key: string; value: unknown }[],
): AppSettings {
  const merged = structuredClone(defaults) as unknown as Record<string, Record<string, unknown>>;
  for (const { key, value } of rows) {
    const [group, leaf] = key.split('.');
    if (group && leaf && merged[group] && leaf in merged[group]) merged[group][leaf] = value;
  }
  return merged as unknown as AppSettings;
}
