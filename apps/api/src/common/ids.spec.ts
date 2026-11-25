import { newId, ulid } from './ids.js';

describe('ids', () => {
  it('builds a prefixed 26-character ULID', () => {
    expect(newId('dsp')).toMatch(/^dsp_[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it('sorts by creation time', () => {
    const zeros = new Uint8Array(16);
    expect(ulid(1_000, zeros) < ulid(2_000, zeros)).toBe(true);
  });
});
