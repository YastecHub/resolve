import { percentile } from './percentile.js';

describe('percentile', () => {
  it('returns 0 for no values', () => {
    expect(percentile([], 50)).toBe(0);
  });

  it('uses the nearest rank', () => {
    const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    expect(percentile(values, 50)).toBe(50);
    expect(percentile(values, 95)).toBe(100);
    expect(percentile(values, 0)).toBe(10);
    expect(percentile([7], 95)).toBe(7);
  });
});
