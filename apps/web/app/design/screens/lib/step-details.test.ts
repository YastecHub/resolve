import { describe, expect, it } from 'vitest';
import { stepDetails } from './step-details';

describe('stepDetails', () => {
  it('shows scalar fields of a tool result with readable labels', () => {
    const details = stepDetails(
      {
        ok: true,
        data: {
          transaction_id: 'txn_1',
          reference: 'TRX123',
          amount_minor: 1_250_000,
          status: 'successful',
          flagged: false,
          device_id: null,
        },
      },
      true,
    );
    expect(details).toEqual({
      Reference: 'TRX123',
      'Amount minor': '₦12,500.00',
      Status: 'successful',
      Flagged: 'No',
    });
  });

  it('hides raw ids and duplicate ISO timestamps, including inside nested objects', () => {
    const details = stepDetails(
      {
        ok: true,
        data: {
          device_id: 'dev_1',
          created_at: Date.UTC(2026, 9, 10, 12),
          created_at_iso: '2026-10-10T12:00:00.000Z',
          merchant: { merchant_id: 'mer_1', category: 'fuel' },
        },
      },
      true,
    )!;
    expect(Object.keys(details).sort()).toEqual(['Created at', 'Merchant category']);
  });

  it('flattens nested objects one level and summarises lists', () => {
    const details = stepDetails(
      {
        ok: true,
        data: {
          merchant: { name: '<untrusted>Shoprite</untrusted>', flagged: true },
          entries: [{ a: 1 }, { a: 2 }],
          related: [],
        },
      },
      true,
    );
    expect(details).toEqual({
      'Merchant name': 'Shoprite',
      'Merchant flagged': 'Yes',
      Entries: '2 items',
      Related: '0 items',
    });
  });

  it('strips untrusted tags and shortens very long values', () => {
    const details = stepDetails(
      { ok: true, data: { memo: `<untrusted>${'x'.repeat(200)}</untrusted>` } },
      true,
    )!;
    expect(details.Memo).toHaveLength(81);
    expect(details.Memo).toMatch(/^x+…$/);
    expect(details.Memo).not.toContain('untrusted');
  });

  it('formats epoch timestamps but leaves small numbers alone', () => {
    const details = stepDetails(
      { ok: true, data: { posted_at: Date.UTC(2026, 9, 10, 12), age_minutes: 90 } },
      true,
    )!;
    expect(details['Posted at']).toMatch(/2026/);
    expect(details['Age minutes']).toBe('90');
  });

  it('caps the number of rows', () => {
    const data = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`field_${i}`, i]));
    expect(Object.keys(stepDetails({ ok: true, data }, true)!)).toHaveLength(12);
  });

  it('returns nothing for failed, empty or odd outputs', () => {
    expect(stepDetails({ ok: false, error: 'Not found' }, false)).toBeUndefined();
    expect(stepDetails({ ok: true, data: {} }, true)).toBeUndefined();
    expect(stepDetails({ ok: true, data: [1, 2] }, true)).toBeUndefined();
    expect(stepDetails(null, true)).toBeUndefined();
    expect(stepDetails('text', true)).toBeUndefined();
    expect(stepDetails({ message: 'Started' }, true)).toBeUndefined();
  });
});
