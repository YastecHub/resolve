import { flattenSettings, mergeSettings, settingsDefaults } from './settings.defaults.js';

describe('settings', () => {
  it('overlays stored rows on the defaults and ignores unknown keys', () => {
    const merged = mergeSettings(settingsDefaults({}), [
      { key: 'policy.confidenceThreshold', value: 0.8 },
      { key: 'agent.maxSteps', value: 5 },
      { key: 'policy.nope', value: 1 },
      { key: 'junk', value: 1 },
    ]);
    expect(merged.policy.confidenceThreshold).toBe(0.8);
    expect(merged.agent.maxSteps).toBe(5);
    expect(merged.policy).not.toHaveProperty('nope');
    expect(merged.policy.valueCapMinor).toBe(5_000_000);
  });

  it('takes the active profile from the environment', () => {
    expect(settingsDefaults({ AI_ACTIVE_PROFILE: 'onprem' }).ai.activeProfile).toBe('onprem');
  });

  it('flattens a partial update to one row per leaf', () => {
    expect(
      flattenSettings({ policy: { valueCapMinor: 100, autoTypes: undefined }, agent: undefined }),
    ).toEqual([{ key: 'policy.valueCapMinor', value: 100 }]);
  });
});
