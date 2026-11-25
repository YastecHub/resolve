import { describe, expect, it } from 'vitest';
import { formatNaira, minorToNaira, nairaToMinor } from './money';

describe('formatNaira', () => {
  it('formats whole and fractional amounts', () => {
    expect(formatNaira(1_250_000)).toBe('₦12,500.00');
    expect(formatNaira(5)).toBe('₦0.05');
    expect(formatNaira(0)).toBe('₦0.00');
    expect(formatNaira(100_05)).toBe('₦100.05');
  });

  it('formats negatives with a leading sign', () => {
    expect(formatNaira(-1_250_000)).toBe('-₦12,500.00');
    expect(formatNaira(-1)).toBe('-₦0.01');
  });

  it('formats large values without precision loss', () => {
    expect(formatNaira(123_456_789_012_345)).toBe('₦1,234,567,890,123.45');
    expect(formatNaira(Number.MAX_SAFE_INTEGER)).toBe('₦90,071,992,547,409.91');
  });

  it('rejects non-integer or unsafe input', () => {
    expect(() => formatNaira(10.5)).toThrow(RangeError);
    expect(() => formatNaira(Number.NaN)).toThrow(RangeError);
    expect(() => formatNaira(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});

describe('nairaToMinor', () => {
  it('converts exactly for common values', () => {
    expect(nairaToMinor(12_500)).toBe(1_250_000);
    expect(nairaToMinor(0.01)).toBe(1);
  });

  it('rounds away float error', () => {
    expect(nairaToMinor(1.005)).toBe(101);
    expect(nairaToMinor(0.1 + 0.2)).toBe(30);
    expect(nairaToMinor(19.99)).toBe(1999);
    expect(nairaToMinor(1.234)).toBe(123);
  });

  it('handles negatives symmetrically', () => {
    expect(nairaToMinor(-12.5)).toBe(-1250);
    expect(nairaToMinor(-1.005)).toBe(-101);
  });

  it('handles large values', () => {
    expect(nairaToMinor(1_000_000_000)).toBe(100_000_000_000);
  });

  it('rejects non-finite input', () => {
    expect(() => nairaToMinor(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('minorToNaira', () => {
  it('converts back to naira', () => {
    expect(minorToNaira(1_250_000)).toBe(12_500);
    expect(minorToNaira(-5)).toBe(-0.05);
  });

  it('rejects non-integer input', () => {
    expect(() => minorToNaira(1.5)).toThrow(RangeError);
  });
});
